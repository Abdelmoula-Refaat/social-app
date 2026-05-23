"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication_gql = exports.authentication = void 0;
const global_error_handler_1 = require("../utils/global-error-handler");
const token_service_1 = __importDefault(require("../service/token.service"));
const redis_service_1 = __importDefault(require("../service/redis.service"));
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const config_service_1 = require("../../config/config.service");
const userModel = new user_repository_1.default();
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new global_error_handler_1.AppError("token not found");
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_handler_1.AppError("token not found");
    }
    let ACCESS_SECRET_KEY = "";
    if (prefix === config_service_1.PERFIX_USER) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix === config_service_1.PERFIX_Admin) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_Admin;
    }
    else {
        throw new global_error_handler_1.AppError("Invalid token prefix");
    }
    const decoded = token_service_1.default.VerifyToken({ token, secret_key: ACCESS_SECRET_KEY });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_1.AppError("Invalid token payload");
    }
    const user = await userModel.findOne({ filter: { _id: decoded.id } });
    if (!user) {
        throw new global_error_handler_1.AppError("User not exist", 400);
    }
    if (!user.confrimed) {
        throw new global_error_handler_1.AppError("Please confirm your email", 400);
    }
    const revokedToken = await redis_service_1.default.getValue(redis_service_1.default.revoked_key({ userId: decoded.id, jti: decoded.jti }));
    if (revokedToken) {
        throw new global_error_handler_1.AppError("Token has been revoked");
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
const authentication_gql = async (authorization) => {
    if (!authorization) {
        throw new global_error_handler_1.AppError("token not found");
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_handler_1.AppError("token not found");
    }
    let ACCESS_SECRET_KEY = "";
    if (prefix === config_service_1.PERFIX_USER) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix === config_service_1.PERFIX_Admin) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_Admin;
    }
    else {
        throw new global_error_handler_1.AppError("Invalid token prefix");
    }
    const decoded = token_service_1.default.VerifyToken({ token, secret_key: ACCESS_SECRET_KEY });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_1.AppError("Invalid token payload");
    }
    const user = await userModel.findOne({ filter: { _id: decoded.id } });
    if (!user) {
        throw new global_error_handler_1.AppError("User not exist", 400);
    }
    return { user, decoded };
};
exports.authentication_gql = authentication_gql;
