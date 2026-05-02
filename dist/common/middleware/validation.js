"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const global_error_handler_1 = require("../utils/global-error-handler");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErro = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
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
