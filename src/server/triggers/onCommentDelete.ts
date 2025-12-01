import { Request, Response } from "express";
import { HttpResponse } from "../types.js";
import { EventSource, T1 } from "@devvit/web/shared";
import { onThingDeletedByUser, onThingRemovedByModerator, ThingDeleteRequestBody } from "./onThingDelete.js";
    
type CommentDeleteRequestBody = { commentId: T1; } & ThingDeleteRequestBody;

export const onCommentDelete = async (request: Request, response: Response) => {
    const body = request.body as CommentDeleteRequestBody;
    if (!body.commentId || !body.author?.name || !body.source || !body.deletedAt) {
        return response.status(400).json({ message: 'malformed comment delete event' });
    }

    let result: HttpResponse;
    switch (body.source) {
        case EventSource.USER:
            result = await onThingDeletedByUser(body.commentId, body);
            break;
        case EventSource.MODERATOR:
        case EventSource.ADMIN:
            result = await onThingRemovedByModerator(body.commentId, body);
            break;
        default:
            result = { status: 501, message: 'unknown event source' };
            break;
    }

    return response.status(result.status).json({ message: result.message });
};
