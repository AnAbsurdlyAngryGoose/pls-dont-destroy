import { Response } from "express";
import { Code } from "./types";

/**
 * Unceremoniously bail with an uncaught exception
 * @param message message to include in the trace
 * @returns never
 * @example might_be_undefined ?? panic("Something went wrong")
 */
export const panic = (message: string): never => {
    throw new Error(message);
};

const StatusData = {
    [Code.ok]: { status: 'ok', code: 200 },
    [Code.badRequest]: { status: 'received malformed event data', code: 400 },
    [Code.notFoundOrInaccessible]: { status: 'data not found or inaccessible', code: 404 },
    [Code.error]: { status: 'application error', code: 500 },
    [Code.unsupported]: { status: 'unsupported operation', code: 501 }
} as const;

/** helper method encapsulating the log-respond pattern */
export const respond = (response: Response, code: Code, message?: string) => {
    const status = StatusData[code];
    const payload = message ? { ...status, message } : status;

    console.log('responding', status.status, message ?? '');
    return response.status(status.code).send(payload);
};
