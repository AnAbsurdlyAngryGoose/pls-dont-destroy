import { SettingsValues, settings, context } from "@devvit/web/server";
import { Release, Threshold } from "./types.js";
import { intersection } from "lodash";

class Configuration {
    private values: SettingsValues;

    constructor(values: SettingsValues) {
        this.values = values;
    };

    /**
     * Getters for raw settings values
     */

    get blackholeRemovalReason(): string {
        return String(this.values['blackholeRemovalReason']);
    };

    get notificationThreshold(): number {
        return Number(this.values['notificationThreshold']);
    };

    get notificationTemplate(): string {
        return String(this.values['notificationTemplate']);
    };

    get temporaryBanThreshold(): number {
        return Number(this.values['temporaryBanThreshold']);
    };

    get temporaryBanDuration(): number {
        return Number(this.values['temporaryBanDuration']);
    };

    get temporaryBanTemplate(): string {
        return String(this.values['temporaryBanTemplate']);
    };

    get permanentBanThreshold(): number {
        return Number(this.values['permanentBanThreshold']);
    };

    get permanentBanTemplate(): string {
        return String(this.values['permanentBanTemplate']);
    };

    get blackholeThreshold(): number {
        return Number(this.values['blackholeThreshold']);
    };

    get selectedUpdateCategories(): Release[] {
        return this.values['receiveUpdateNotifications'] as Release[];
    }

    /**
     * Derived values
     */

    get issueTemporaryBans(): boolean {
        return this.temporaryBanThreshold > 0;
    };

    get issuePermanentBans(): boolean {
        return this.permanentBanThreshold > 0;
    };

    get sendNotifications(): boolean {
        /* notifications will always be sent providing no other threshold is met */
        return true;
    };

    get enforceBlackholes(): boolean {
        return this.blackholeThreshold > 0 &&
               this.permanentBanThreshold == 0;
    };

    thresholdMet(n: number): Threshold {
        // p0: permanent bans are issued and the threshold is met
        if (this.issuePermanentBans && n >= this.permanentBanThreshold) {
            return Threshold.permaban;
        }

        // p1: blackholes are enforced and the threshold is met
        // nb: blackholes are disabled if permanent bans are enabled
        if (this.enforceBlackholes && n >= this.blackholeThreshold) {
            return Threshold.blackhole;
        }

        // p2: temporary bans are issued and the threshold is met
        if (this.issueTemporaryBans && n >= this.temporaryBanThreshold) {
            return Threshold.tempban;
        }

        // p3: send notification if enabled or threshold is met
        // nb: notifications are always enabled
        if (this.sendNotifications && n >= this.notificationThreshold) {
            return Threshold.notify;
        }

        return Threshold.none;
    };

    get notificationMessage(): string {
        return this.makeSubstitions(this.notificationTemplate)
    };

    get temporaryBanMessage(): string {
        return this.makeSubstitions(this.temporaryBanTemplate);
    };

    get permanentBanMessage(): string {
        return this.makeSubstitions(this.permanentBanTemplate);
    };

    /** true if a category is selected, else false */
    sendUpdateNotifications(...categories: Release[]): boolean {
        return categories.includes(Release.critical) ||
               intersection(categories, this.selectedUpdateCategories).length > 0;
    };

    /** internal methods */

    private makeSubstitions(str: string): string {
        return str
            .replace(/{{subreddit}}/g, `r/${context.subredditName}`)
            .replace(/{{username}}/g, `u/${context.username || '[unknown]'}`);
    };
};

export const configuration = async () => {
    const values = await settings.getAll();
    return new Configuration(values);
};
