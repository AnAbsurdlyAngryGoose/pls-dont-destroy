import { Request, Response } from "express";

interface IsUUIDRequestBody {
    value: string;
};

export const isUUID = (request: Request, response: Response) => {
    const { value } = request.body as IsUUIDRequestBody;

    // test for v5 compliant uuids
    const isUUID = /^[0-9A-F]{8}-[0-9A-F]{4}-[5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(value);
    return response.json({
        success: isUUID,
        error: isUUID ? undefined : "Value must be a valid UUID v5."
    });
};
