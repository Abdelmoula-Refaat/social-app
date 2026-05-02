import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";
import tokenService from "../service/token.service";
import redisService from "../service/redis.service";
import UserRepository from "../../DB/repositories/user.repository";
import { ACCESS_SECRET_KEY_Admin, ACCESS_SECRET_KEY_USER, PERFIX_Admin, PERFIX_USER } from "../../config/config.service";

const userModel = new UserRepository();

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new AppError("token not found");
    }

    const [prefix, token]: string[] = authorization.split(" ");

    if (!token) {
        throw new AppError("token not found");
    }

    let ACCESS_SECRET_KEY = "";
    if (prefix === PERFIX_USER) {
        ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_USER!;
    } else if (prefix === PERFIX_Admin) {
        ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_Admin!;
    } else {
        throw new AppError("Invalid token prefix");
    }

    const decoded = tokenService.VerifyToken({ token, secret_key: ACCESS_SECRET_KEY  });

    if (!decoded || !decoded?.id ) {
        throw new AppError("Invalid token payload");
    }

    const user = await userModel.findOne({ filter: { _id: decoded.id } });

    if (!user) {
        throw new AppError("User not exist", 400);
    }

    if(!user.confrimed) {
        throw new AppError("Please confirm your email", 400);
    }

    const revokedToken = await redisService.getValue(redisService.revoked_key({ userId: decoded.id, jti: decoded.jti! }));

    if (revokedToken) {
        throw new AppError("Token has been revoked");
    }

    req.user = user;
    req.decoded = decoded;

    next();

}