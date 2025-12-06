import { Request, Response } from "express";
import { blackhole } from "./blackhole.js";
import { updateLastSeen } from "../chronology.js";
import { respond } from "../utilities.js";
import { Code } from "../types.js";

export const onCommentCreate = async (request: Request, response: Response) => {
    const t1 = request.body.comment.id;
    const username = request.body.author.name;
    if (!t1 || !username) {
        return respond(response, Code.badRequest, 'malformed comment create event');
    }

    await updateLastSeen(username);

    const result = await blackhole(t1, username);
    return respond(response, result.status, result.message);
};
