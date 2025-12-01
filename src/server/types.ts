export type HttpResponse = {
    status: number,
    message: string
};

export enum Threshold {
    none = "none",
    notify = "notify",
    tempban = "tempban",
    permaban = "permaban",
    blackhole = "blackhole"
};

export enum Release {
    major = "major",
    minor = "minor",
    patch = "patch",
    critical = "critical" // patches that address critical issues
};
