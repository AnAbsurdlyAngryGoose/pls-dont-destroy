import { Request, Response } from "express";
import { blackhole } from "./blackhole.js";
import { updateLastSeen } from "../chronology.js";

export const onPostCreate = async (request: Request, response: Response) => {
    const t3 = request.body.post.id;
    const username = request.body.author.name;
    if (!t3 || !username) {
        console.error('onPostCreate', 'unexpectedly encountered malformed post create event');
        return response.status(400).json({ status: 'bad request' });
    }

    await updateLastSeen(username);

    const result = await blackhole(t3, username);
    return response.status(result.status).json({ message: result.message });
};
