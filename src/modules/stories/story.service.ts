import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { successResponse } from "../../common/utils/security/response.success";
import { AppError } from "../../common/utils/global-error-handler";
import StoryRepository from "../../DB/repositories/story.repository";
import { S3Service } from "../../common/service/s3.service";
import { Store_Enum } from "../../common/enum/multer.enum";
import { STORY_TTL_HOURS } from "../../common/enum/story.enum";
import { randomUUID } from "node:crypto";

class StoryService {
  private readonly _storyRepo = new StoryRepository();
  private readonly _s3Service = new S3Service();

  createStory = async (req: Request, res: Response, next: NextFunction) => {
    const folderId = randomUUID();
    let urls: string[] = [];
    if (req.files?.length) {
      urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user!._id}/stories/${folderId}`,
        store_type: Store_Enum.memory,
      });
    }
    if (!urls.length) {
      throw new AppError("At least one media file is required", 400);
    }
    const story = await this._storyRepo.create({
      createdBy: req.user!._id,
      attachments: urls,
      expiresAt: new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000),
    });
    successResponse({ res, data: story });
  };

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    const stories = await this._storyRepo.paginate({
      page: +req.query.page!,
      limit: +req.query.limit!,
      sort: { createdAt: -1 },
      search: { createdBy: req.user!._id, expiresAt: { $gt: new Date() } },
    });
    successResponse({ res, data: stories });
  };

  feed = async (req: Request, res: Response, next: NextFunction) => {
    const me = req.user!._id;
    const network = [me, ...(req.user!.friends || [])];
    const stories = await this._storyRepo.paginate({
      page: +req.query.page!,
      limit: +req.query.limit!,
      sort: { createdAt: -1 },
      populate: { path: "createdBy", select: "firstName lastName profilePic" },
      search: {
        createdBy: { $in: network },
        expiresAt: { $gt: new Date() },
      },
    });
    successResponse({ res, data: stories });
  };

  deleteStory = async (req: Request, res: Response, next: NextFunction) => {
    const storyIdRaw = req.params.storyId;
    const storyIdStr = Array.isArray(storyIdRaw) ? storyIdRaw[0] : storyIdRaw;
    if (!storyIdStr) {
      throw new AppError("Missing storyId", 400);
    }
    const storyOid = new Types.ObjectId(storyIdStr);
    const story = await this._storyRepo.findOne({
      filter: { _id: storyOid, createdBy: req.user!._id },
    });
    if (!story) {
      throw new AppError("Story not found or not authorized", 404);
    }
    if (story.attachments?.length) {
      await this._s3Service.deleteFiles(story.attachments);
    }
    await this._storyRepo.findOneAndDelete({
      filter: { _id: storyOid, createdBy: req.user!._id },
    });
    successResponse({ res, data: { deleted: true } });
  };
}

export default new StoryService();
