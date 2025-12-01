import { Request, Response } from "express";

interface CheckSubstitutionsRequestBody {
    value: string;
};

export const checkSubstitutions = (request: Request, response: Response) => {
    const { value } = request.body as CheckSubstitutionsRequestBody;

    const remainder = value.replace(/\{\{\s*[^{}\s][^{}]*\s*\}\}/g, "");
    const hasInvalidBraces = /[{}]/.test(remainder);

    return response.json({
        success: !hasInvalidBraces,
        error: hasInvalidBraces ? "Value must not contain invalid substitutions." : undefined
    });
};
