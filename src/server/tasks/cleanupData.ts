import { context, reddit, redis, User } from "@devvit/web/server";
import { Request, Response } from "express";
import { later, now } from "../chronology.js";

const userIsActive = async (username: string): Promise<boolean> => {
    let user: User | undefined;
    try {
        user = await reddit.getUserByUsername(username);
    } catch { }

    if (user) {
        return true;
    }

    try {
        await reddit.getModNotes({
            subreddit: context.subredditName,
            user: username,
        }).all();
    } catch {
        return false;
    }

    return true;
};

export const cleanupData = async (_: Request, response: Response) => {
    const start = now();
    const stop = later({ hours: 1, minutes: 10 }); // the schedule runs hourly, but process with some overlap for reassurance
    const expiring = await redis.zRange('monitored', start, stop, { by: 'score' });

    // collect activity statuses
    const status = await Promise.all(expiring.map(async ({ member }) => {
        const active = await userIsActive(member);
        return { member, active };
    }));

    // bail early if nothing to do
    if (!status.length) {
        return response.status(200).send({ message: `no users to process` });
    }

    // refresh expiry for active users
    const refresh = status.filter(s => s.active).map(({ member }) => ({
        member,
        score: later({ days: 1 }),
    }));

    // attempting to zadd nothing is an error
    if (refresh.length) {
        await redis.zAdd('monitored', ...refresh);
    }

    // likewise, if nothing to expire, bail early
    const expired = status.filter(s => !s.active).map(({ member }) => member);
    if (!expired.length) {
        return response.status(200).send({ message: `no users to expire` });
    }

    // generate the key sets
    const data = expired.flatMap(m => [m, `${m}:things`, `${m}:stats`]);
    await redis.del(...data);
    await redis.zRem('monitored', expired);

    console.debug('cleanupUsers', `expiring=${expiring.length}; refreshed=${refresh.length}; cleared=${expired.length}`);
    return response.status(200).send({ message: `cleaned up ${expiring.length} users.`});
};
