import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/global-error-handler";
import { GraphQLError } from "graphql";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: schemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationErro = [];

        for (const key of Object.keys(schema) as reqType[]) {

            if (!schema[key]) continue;
            if(req?.file){
                req.body.attachment = req.file;
            }
            if(req?.files){
                req.body.attachments = req.files;
            }
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

export const validation_gql = async (schema: ZodType, data: any) => {
        const validationErro = [];

        const result = await schema.safeParseAsync(data);

        if (!result?.success) {
            const errors = result.error.issues.map((err: any) => {
                return {
                    path: err.path[0],
                    message: err.message,
                }
            });
            validationErro.push(...errors);
        }

        if (validationErro.length) {
            throw new GraphQLError("vaildation failed",
                {
                    extensions: {
                        code: "BAD_REQUESR",
                        status: 400,
                        errors: validationErro
                    },
                }
            );
        }
       
};