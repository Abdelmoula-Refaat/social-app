import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";
import { RoleEnum } from "../enum/user.enum";

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (role !== RoleEnum.admin && role !== RoleEnum.superAdmin) {
    throw new AppError("Forbidden: admin only", 403);
  }
  next();
};
