import { Request, Response } from "express";
import { HttpResponse } from "../types.js";
import { EventSource, T3 } from "@devvit/web/shared";
import { onThingDeletedByUser, onThingRemovedByModerator, ThingDeleteRequestBody } from "./onThingDelete.js";
    
type PostDeleteRequestBody = { postId: T3; } & ThingDeleteRequestBody;

export const onPostDelete = async (request: Request, response: Response) => {
    const body = request.body as PostDeleteRequestBody;
    if (!body.postId || !body.author?.name || !body.source || !body.deletedAt) {
        return response.status(400).json({ message: 'malformed post delete event' });
    }

    let result: HttpResponse;
    switch (body.source) {
        case EventSource.USER:
            result = await onThingDeletedByUser(body.postId, body);
            break;
        case EventSource.MODERATOR:
        case EventSource.ADMIN:
            result = await onThingRemovedByModerator(body.postId, body);
            break;
        default:
            result = { status: 501, message: 'unknown event source' };
            break;
    }

    return response.status(result.status).json({ message: result.message });
};
