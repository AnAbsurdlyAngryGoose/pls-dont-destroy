import { Temporal } from "@js-temporal/polyfill";
import { redis } from "@devvit/web/server";

/** Get the utc time in milliseconds since the linux epoch */
export const now = () => {
    return Temporal.Now.zonedDateTimeISO("UTC").epochMilliseconds;
};

/** Get the utc time + offset in milliseconds since the linux epoch */
export const later = (offset: Temporal.DurationLike) => {
    return Temporal.Now.zonedDateTimeISO("UTC").add(offset).epochMilliseconds;
};

/** Get a Date object representing utc now + offset */
export const laterDate = (offset: Temporal.DurationLike) => {
    return new Date(later(offset));
};

/** now + offset ± (offset / 2) */
export const fuzzedLater = (offset: Temporal.DurationLike) => {
    const x = Temporal.Duration.from(offset).total("milliseconds") / 2;
    const f = Math.random() * (x * 2) - x;
    return later(offset) + f;
};

/** now + offset ± (offset / 2) but it's a Date */
export const fuzzedLaterDate = (offset: Temporal.DurationLike) => {
    return new Date(fuzzedLater(offset));
};

/** Update the last seen time for a given user in redis */
export const updateLastSeen = async (username: string): Promise<void> => {
    await redis.zAdd(`monitor`, {
        score: fuzzedLater({ days: 1 }),
        member: username,
    });
};
