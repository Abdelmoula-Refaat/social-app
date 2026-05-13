import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { successResponse } from "../../common/utils/security/response.success";
import { AppError } from "../../common/utils/global-error-handler";
import UserRepository from "../../DB/repositories/user.repository";

class UsersService {
  private readonly _users = new UserRepository();

  publicProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userIdRaw = req.params.userId;
    const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
    if (!userId) {
      throw new AppError("Missing userId", 400);
    }
    const user = await this._users.findOne({
      filter: { _id: new Types.ObjectId(userId) },
      projection: {
        firstName: 1,
        lastName: 1,
        profilePic: 1,
        gender: 1,
        createdAt: 1,
      },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    successResponse({ res, data: { user } });
  };
}

export default new UsersService();
