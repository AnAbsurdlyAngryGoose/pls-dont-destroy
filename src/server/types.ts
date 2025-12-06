export type HttpResponse = {
    status: Code,
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

export enum Code {
    ok = 200,
    badRequest = 400,
    notFoundOrInaccessible = 404,
    error = 500,
    unsupported = 501
};
