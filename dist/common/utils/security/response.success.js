"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
const successResponse = ({ res, status = 200, message = "done", data = undefined }) => {
    return res.status(status).json({ message, data });
};
exports.successResponse = successResponse;
