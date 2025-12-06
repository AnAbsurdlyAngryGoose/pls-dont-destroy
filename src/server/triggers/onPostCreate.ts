import { Request, Response } from "express";
import { blackhole } from "./blackhole.js";
import { updateLastSeen } from "../chronology.js";
import { respond } from "../utilities.js";
import { Code } from "../types.js";

export const onPostCreate = async (request: Request, response: Response) => {
    const t3 = request.body.post.id;
    const username = request.body.author.name;
    if (!t3 || !username) {
        return respond(response, Code.badRequest, 'malformed post create event');
    }

    await updateLastSeen(username);

    const result = await blackhole(t3, username);
    return respond(response, result.status, result.message);
};
