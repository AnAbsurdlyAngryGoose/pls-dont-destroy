import { Request, Response } from "express";

interface IsNaturalNumberRequestBody {
    value: number;
};

export const isNaturalNumber = (request: Request, response: Response) => {
    const { value } = request.body as IsNaturalNumberRequestBody;

    if (Number.isInteger(value) && value >= 0) {
        return response.json({ success: true });
    }

    return response.json({
        success: false,
        error: "Value must be a whole number greater than or equal to 0."
    });
};
