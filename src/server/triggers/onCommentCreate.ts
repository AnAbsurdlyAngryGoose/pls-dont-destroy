import { Request, Response } from "express";
import { blackhole } from "./blackhole.js";
import { updateLastSeen } from "../chronology.js";

export const onCommentCreate = async (request: Request, response: Response) => {
    const t1 = request.body.comment.id;
    const username = request.body.author.name;
    if (!t1 || !username) {
        console.error('onCommentCreate', 'unexpectedly encountered malformed comment create event');
        return response.status(400).json({ message: 'malformed comment create event' });
    }

    await updateLastSeen(username);

    const result = await blackhole(t1, username);
    return response.status(result.status).json({ message: result.message });
};
