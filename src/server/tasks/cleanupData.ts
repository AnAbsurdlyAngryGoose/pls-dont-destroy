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

    // refresh expiry for active users
    const refresh = status.filter(s => s.active).map(({ member }) => ({
        member,
        score: later({ days: 1 }),
    }));
    await redis.zAdd('monitored', ...refresh);

    // generate the key sets
    const expired = status.filter(s => !s.active).map(({ member }) => member);
    const data = expired.flatMap(m => [m, `${m}:things`, `${m}:stats`]);

    // cleanup
    await redis.del(...data);
    await redis.zRem('monitored', expired);

    console.debug('cleanupUsers', `expiring=${expiring.length}; refreshed=${refresh.length}; cleared=${expired.length}`);
    return response.status(200).send({ message: `cleaned up ${expiring.length} users.`});
};
