import { context, reddit, redis, WikiPage } from "@devvit/web/server";
import { Request, Response } from "express";
import { clean, gte } from "semver";
import { bold, p, sub, ul } from "ts-markdown";
import { Code, Release } from "../types.js";
import { markdown } from "../markdown.js";
import { configuration } from "../configuration.js";
import { respond } from "../utilities.js";

type ReleaseNote = {
    semver: string;
    cycle: Release;
    news: string[];
};

const domain = 'absurdlyangryapps';
const root = 'release-notes';
const your_version = "{{your_version}}";
const new_version = "{{new_version}}";
const subject = `[ App Upgrade ] Please Don't Destroy ${new_version} is now available!`;
const brief = `A new version of the Please Don't Destroy is now available. Your subreddit is currently using version ${your_version}. This release introduces version ${new_version}, which includes new features, enhancements, and fixes described in the sections below.`;
const whats_new = `Here's what's new in version ${new_version}:`;
const release = {
    [Release.major]: p(["This is a", bold("major"), "release introducing significant new features, architectural enhancements, and compatibility updates. It may include breaking changes and requires careful review of the upgrade notes before deployment."]),
    [Release.minor]: p(["This is a", bold("minor"), "release delivering incremental improvements, feature enhancements, and user-experience updates. It is fully backward-compatible and recommended for all customers seeking the latest functionality."]),
    [Release.patch]: p(["This is a", bold("patch"), "release including targeted fixes that address defects, security issues, and/or performance optimisations. To avoid service interruptions, it is recommended to apply this update promptly."]),
    [Release.critical]: p(["This is a", bold("critical patch"), "release that addresses urgent issues impacting security, stability, or compliance. It is strongly advised to implement this update immediately to mitigate potential risk."])
};

export const checkForUpdates = async (_: Request, response: Response) => {
    // playtest builds use x.y.z.n
    const current = clean(context.appVersion);
    if (!current) {
        return respond(response, Code.ok, `routine not run during playtest`);
    }

    const slug = `${root}/${context.appName}`;
    let document: WikiPage;
    try {
        document = await reddit.getWikiPage(domain, slug);
    } catch {
        return respond(response, Code.notFoundOrInaccessible, `${domain}/${slug} not found or inaccessible`);
    }

    const { semver, cycle, news } = JSON.parse(document.content) as ReleaseNote;

    // check if we're actually going to notify about an upgrade
    const config = await configuration();
    if (!config.sendUpdateNotifications(cycle)) {
        return respond(response, Code.ok, `configured to skip ${cycle} notifications`);
    }

    // triple check that the upgrade data is well formed
    const future = clean(semver);
    if (!future) {
        return respond(response, Code.error, `version ${semver} is not semantic`);
    }

    // check if we've already notified about this version
    const seen = await redis.get(`latest-version`) === future;
    if (seen) {
        return respond(response, Code.ok, `already notified`);
    }

    // if the current version is greater than or equal to the upgrade version, we're up to date
    const fresh = gte(current, future);
    if (fresh) {
        return respond(response, Code.ok, `up to date`);
    }

    // note that this may differ from the cycle declared in the release notes
    // f.ex. current=0.3.0, upgrade=1.0.1, cycle=patch, type=major
    // for critical patches, this would only apply if the fault is in the current version
    // perhaps that needs to be an optional field in the release notes?
    // for now, since this will be v1 anyway, we'll not worry about it. a future version can fix this.
    // const type = diff(current, future) ?? panic("unable to determine version difference");

    const notification = await reddit.modMail.createModNotification({
        subject: subject.replace(new_version, future).replace(your_version, current),
        subredditId: context.subredditId,
        bodyMarkdown: markdown([
            p(brief.replace(your_version, current).replace(new_version, future)),
            p(release[cycle]),
            p(whats_new.replace(new_version, future)),
            ul(news),
            p("Thank you for using Please Don't Destroy!"),
            sub("You're receiving this notification because your subreddit has Please Don't Destroy installed and has opted-in for update notifications."),
        ])
    });

    await redis.set(`latest-version`, future);
    return respond(response, Code.ok, `sent notification ${notification}`);
};
    