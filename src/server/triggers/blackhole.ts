import { reddit, redis } from "@devvit/web/server";
import { T1, T3 } from "@devvit/web/shared";
import { HttpResponse, Threshold } from "../types.js";
import { configuration } from "../configuration.js";

export const blackhole = async (tx: T1 | T3, username: string): Promise<HttpResponse> => {
    const deletions = Number(await redis.hGet(username, 'deleted') || 0);
    const config = await configuration();
    if (config.thresholdMet(deletions) !== Threshold.blackhole) {
        return { status: 200, message: 'blackholes are not enabled, or the user has not met the threshold yet' };
    }

    await reddit.remove(tx, false);
    await reddit.addRemovalNote({
        itemIds: [tx],
        modNote: "user is autofiltered",
        reasonId: config.blackholeRemovalReason,
    });

    return { status: 200, message: 'comment blackholed' };
};
