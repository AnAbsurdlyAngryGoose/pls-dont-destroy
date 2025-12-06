import { EventSource, T1, T3 } from "@devvit/web/shared";
import { reddit, redis } from "@devvit/web/server";
import { HttpResponse, Threshold } from "../types.js";
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

    const threshold = config.thresholdMet(count);
    switch (threshold) {
        case Threshold.none:
            console.debug(`user ${body.author.name} has not met any thresholds for deleted submissions`);
            return { status: 200, message: 'nothing to do' };
        case Threshold.notify:
            console.log(`user ${body.author.name} has met the notification threshold for deleted submissions`);
            await reddit.sendPrivateMessage({
                to: body.author.name,
                subject: 'Notice of Comment Deletion',
                text: config.notificationMessage
            });
            return { status: 200, message: 'notification sent' };
        case Threshold.tempban:
            console.log(`user ${body.author.name} has met the temporary ban threshold for deleted submissions`);
            await reddit.banUser({
                username: body.author.name,
                subredditName: body.subreddit.name,
                message: config.temporaryBanMessage,
                reason: config.blackholeRemovalReason,
                duration: config.temporaryBanDuration,
            });
            return { status: 200, message: 'tempban issued' };
        case Threshold.permaban:
            console.log(`user ${body.author.name} has met the permanent ban threshold for deleted submissions`);
            await reddit.banUser({
                username: body.author.name,
                subredditName: body.subreddit.name,
                message: config.permanentBanMessage,
                reason: config.blackholeRemovalReason,
            });
            return { status: 200, message: 'permaban issued' };
        case Threshold.blackhole:
            console.log(`user ${body.author.name} has met the blackhole threshold for deleted submissions`);
            return { status: 200, message: 'blackholed user, no further action' };
    };
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
