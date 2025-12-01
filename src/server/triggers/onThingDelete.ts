import { EventSource, T1, T3 } from "@devvit/web/shared";
import { reddit, redis } from "@devvit/web/server";
import { HttpResponse } from "../types.js";
import { laterDate, updateLastSeen } from "../chronology.js";
import { configuration } from "../configuration.js";

// shared between the specific handlers, who each extend this with their own thing type
export type ThingDeleteRequestBody = {
    author: {
        name: string;
    };
    source: EventSource;
    deletedAt: Date;
    subreddit: {
        name: string;
    }
};

export const onThingDeletedByUser = async (thing: T1 | T3, body: ThingDeleteRequestBody): Promise<HttpResponse> => {
    const duplicate = await redis.exists(`deleted:${thing}`);
    if (duplicate) {
        console.debug(`comment ${thing} has already been processed as deleted`);
        return { status: 200, message: 'ok' };
    }

    await updateLastSeen(body.author.name);

    // mark this comment as processed
    await redis.set(`deleted:${thing}`, 'true', {
        expiration: laterDate({ days: 30 })
    });

    // check if this comment was previously moderated
    const score = await redis.zScore(`${body.author.name}:things`, thing);
    const truncated = Math.trunc(score ?? 0);
    if (truncated === 0) {
        console.debug(`comment ${thing} not found in sorted set for user ${body.author.name}, it may not have been moderated or has already been processed`);
        return { status: 404, message: 'comment not moderated or has already been processed' };
    }

    // clear out the entry from the set, so that we don't count it twice
    await redis.zRem(`${body.author.name}:things`, [thing]);

    // increment the deleted count for this user
    const count = await redis.hIncrBy(`${body.author.name}:stats`, 'deleted', 1);
    console.debug(`user ${body.author.name} has deleted ${count} submission(s) that were previously moderated`);
    const config = await configuration();

    // if enabled and the threshold is met, action a permanent ban
    const permaban = config.permanentBanThreshold > 0 && count >= config.permanentBanThreshold;
    if (permaban) {
        await reddit.banUser({
            username: body.author.name,
            subredditName: body.subreddit.name,
            message: config.permanentBanMessage,
            reason: config.blackholeRemovalReason,
        });
    
        console.debug(`permanently banned user ${body.author.name} from subreddit ${body.subreddit.name}`);
        return { status: 200, message: 'permaban issued' };
    }

    // if enabled and the threshold is met, action a temporary ban
    const tempban = config.temporaryBanThreshold > 0 && count >= config.temporaryBanThreshold;
    if (tempban) {
        await reddit.banUser({
            username: body.author.name,
            subredditName: body.subreddit.name,
            message: config.temporaryBanMessage,
            reason: config.blackholeRemovalReason,
            duration: config.temporaryBanDuration,
        });
    
        console.debug(`temporarily banned user ${body.author.name} from subreddit ${body.subreddit.name}`);
        return { status: 200, message: 'tempban issued' };
    }

    // notify the user if the threshold is met and no other action was taken
    // nb that a threshold of 0 means "notify on every deletion"
    const notify = config.notificationThreshold === 0 || count === config.notificationThreshold;
    if (notify) {
        await reddit.sendPrivateMessage({
            to: body.author.name,
            subject: 'Notice of Comment Deletion',
            text: config.notificationMessage
        });

        return { status: 200, message: 'notification sent' };
    }

    return { status: 200, message: 'nothing to do' };
};

export const onThingRemovedByModerator = async (thing: T1 | T3, body: ThingDeleteRequestBody): Promise<HttpResponse> => {
    const duplicate = await redis.exists(`moderated:${thing}`);
    if (duplicate) {
        console.debug(`comment ${thing} has already been processed as moderated`);
        return { status: 200, message: 'duplicate event ignored' };
    }

    await updateLastSeen(body.author.name);

    // mark this comment as processed
    await redis.set(`moderated:${thing}`, 'true', {
        expiration: laterDate({ days: 30 })
    });

    const member = thing;
    const score = body.deletedAt.getTime();
    await redis.zAdd(`${body.author.name}:things`, { member, score });
    console.debug(`added removed comment ${thing} to sorted set for user ${body.author.name}`);

    const cardinality = await redis.zCard(`${body.author.name}:things`);
    console.debug(`user ${body.author.name} has ${cardinality} moderated thing(s) in their sorted set`);
    return { status: 200, message: 'event processed' };
};
