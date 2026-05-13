import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { successResponse } from "../../common/utils/security/response.success";
import { AppError } from "../../common/utils/global-error-handler";
import NotificationRepository from "../../DB/repositories/notification.repository";
import UserRepository from "../../DB/repositories/user.repository";
import fcmService from "../../common/service/notification.service";
import redisService from "../../common/service/redis.service";

const INSERT_CHUNK = 500;
const BROADCAST_CAP = 2000;

class NotificationsAppService {
  private readonly _repo = new NotificationRepository();
  private readonly _users = new UserRepository();

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    const data = await this._repo.paginate({
      page: +req.query.page!,
      limit: +req.query.limit!,
      sort: { createdAt: -1 },
      search: { recipientId: req.user!._id },
    });
    successResponse({ res, data });
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    const { notificationId } = req.params;
    const { read } = req.body;
    const updated = await this._repo.findOneAndUpdate({
      filter: { _id: notificationId, recipientId: req.user!._id },
      update: read ? { $set: { readAt: new Date() } } : { $unset: { readAt: 1 } },
    });
    if (!updated) {
      throw new AppError("Notification not found", 404);
    }
    successResponse({ res, data: updated });
  };

  deleteMine = async (req: Request, res: Response, next: NextFunction) => {
    const { notificationId } = req.params;
    const deleted = await this._repo.findOneAndDelete({
      filter: { _id: notificationId, recipientId: req.user!._id },
    });
    if (!deleted) {
      throw new AppError("Notification not found", 404);
    }
    successResponse({ res, data: { deleted: true } });
  };

  adminList = async (req: Request, res: Response, next: NextFunction) => {
    const data = await this._repo.paginate({
      page: +req.query.page!,
      limit: +req.query.limit!,
      sort: { createdAt: -1 },
      search: { createdBy: req.user!._id },
    });
    successResponse({ res, data });
  };

  adminCreate = async (req: Request, res: Response, next: NextFunction) => {
    const { title, body, broadcast, recipientIds } = req.body;
    const batchId = new Types.ObjectId();
    const createdBy = req.user!._id;

    let targets: Types.ObjectId[] = [];
    if (broadcast) {
      const users = await this._users.find({
        filter: {},
        projection: { _id: 1 },
        options: { limit: BROADCAST_CAP },
      });
      targets = users.map((u) => u._id);
    } else {
      targets = recipientIds.map((id: string) => new Types.ObjectId(id));
    }

    if (!targets.length) {
      throw new AppError("No recipients resolved for this notification", 400);
    }

    const docs = targets.map((recipientId) => ({
      title,
      body,
      recipientId,
      createdBy,
      batchId,
    }));

    for (let i = 0; i < docs.length; i += INSERT_CHUNK) {
      const slice = docs.slice(i, i + INSERT_CHUNK);
      await this._repo.insertMany(slice as never[]);
    }

    const tokens: string[] = [];
    for (const id of targets) {
      const t = await redisService.getFCMs(id);
      tokens.push(...t);
    }
    if (tokens.length) {
      await fcmService.sendNotifications({
        tokens,
        data: { title, body },
      });
    }

    successResponse({
      res,
      data: { batchId, recipients: targets.length },
    });
  };

  adminUpdateBatch = async (req: Request, res: Response, next: NextFunction) => {
    const batchIdRaw = req.params.batchId;
    const batchIdStr = Array.isArray(batchIdRaw) ? batchIdRaw[0] : batchIdRaw;
    if (!batchIdStr) {
      throw new AppError("Missing batchId", 400);
    }
    const batchId = new Types.ObjectId(batchIdStr);
    const { title, body } = req.body;
    const result = await this._repo.updateMany(
      { batchId, createdBy: req.user!._id },
      { $set: { title, body } },
    );
    if (!result.matchedCount) {
      throw new AppError("Batch not found", 404);
    }
    successResponse({ res, data: { modified: result.modifiedCount } });
  };

  adminDeleteBatch = async (req: Request, res: Response, next: NextFunction) => {
    const batchIdRaw = req.params.batchId;
    const batchIdStr = Array.isArray(batchIdRaw) ? batchIdRaw[0] : batchIdRaw;
    if (!batchIdStr) {
      throw new AppError("Missing batchId", 400);
    }
    const batchId = new Types.ObjectId(batchIdStr);
    const result = await this._repo.deleteMany({
      batchId,
      createdBy: req.user!._id,
    });
    if (!result.deletedCount) {
      throw new AppError("Batch not found", 404);
    }
    successResponse({ res, data: { deleted: result.deletedCount } });
  };
}

export default new NotificationsAppService();
