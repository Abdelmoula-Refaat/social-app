"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation_gql = exports.validation = void 0;
const global_error_handler_1 = require("../utils/global-error-handler");
const graphql_1 = require("graphql");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErro = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req?.file) {
                req.body.attachment = req.file;
            }
            if (req?.files) {
                req.body.attachments = req.files;
            }
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationErro.push(result.error.message);
            }
        }
        if (validationErro.length > 0) {
            throw new global_error_handler_1.AppError(JSON.parse(validationErro), 400);
        }
        next();
    };
};
exports.validation = validation;
const validation_gql = async (schema, data) => {
    const validationErro = [];
    const result = await schema.safeParseAsync(data);
    if (!result?.success) {
        const errors = result.error.issues.map((err) => {
            return {
                path: err.path[0],
                message: err.message,
            };
        });
        validationErro.push(...errors);
    }
    if (validationErro.length) {
        throw new graphql_1.GraphQLError("vaildation failed", {
            extensions: {
                code: "BAD_REQUESR",
                status: 400,
                errors: validationErro
            },
        });
    }
};
exports.validation_gql = validation_gql;
