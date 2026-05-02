import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/global-error-handler";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: schemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationErro = [];

        for (const key of Object.keys(schema) as reqType[]) {

            if (!schema[key]) continue;
            const result = schema[key].safeParse(req[key]);

            if (!result.success) {
                validationErro.push(result.error.message);
            }
        }

        if (validationErro.length > 0) {
            throw new AppError(JSON.parse(validationErro as unknown as string), 400);
        }

        next();
    };
};