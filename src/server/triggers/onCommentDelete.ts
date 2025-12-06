import { Request, Response } from "express";
import { Code, HttpResponse } from "../types.js";
import { EventSource, T1 } from "@devvit/web/shared";
import { onThingDeletedByUser, onThingRemovedByModerator, ThingDeleteRequestBody } from "./onThingDelete.js";
import { respond } from "../utilities.js";
    
type CommentDeleteRequestBody = { commentId: T1; } & ThingDeleteRequestBody;

export const onCommentDelete = async (request: Request, response: Response) => {
    const body = request.body as CommentDeleteRequestBody;
    if (!body.commentId || !body.author?.name || !body.source || !body.deletedAt) {
        return respond(response, Code.badRequest, 'malformed comment delete event');
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
            result = { status: Code.unsupported, message: 'unknown event source' };
            break;
    }

    return respond(response, result.status, result.message);
};
