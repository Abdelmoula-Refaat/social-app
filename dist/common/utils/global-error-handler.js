"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.message = message;
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
const globalErrorHandler = (err, req, res, next) => {
    console.log(err.statusCode);
    const status = err.statusCode || 500;
    res.status(status).json({
        message: err.message,
        status,
        stack: err.stack
    });
};
exports.globalErrorHandler = globalErrorHandler;
