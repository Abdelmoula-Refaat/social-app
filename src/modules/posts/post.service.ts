import { NextFunction, Request, Response } from "express";
import UserRepository from "../../DB/repositories/user.repository";
import { successResponse } from "../../common/utils/security/response.success";
import redisService from "../../common/service/redis.service";
import { S3Service } from "../../common/service/s3.service";
import notificationService from "../../common/service/notification.service";
import postRepository from "../../DB/repositories/post.repository";
import { Types } from "mongoose";
import { AppError } from "../../common/utils/global-error-handler";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { AvailabilityPost, feedPostFilter, profilePostsFilter } from "../../common/utils/post.utils";
import { updatePostDto } from "./post.dto";
import { populate } from "dotenv";

function postObjectId(value: string | string[] | undefined): Types.ObjectId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    throw new AppError("Missing postId", 400);
  }
  return new Types.ObjectId(raw);
}

class PostService {
  private readonly _userRepo = new UserRepository();
  private readonly _postRepo = new postRepository();
  private readonly _redisService = redisService;
  private readonly _s3Service = new S3Service();
  private readonly _notificationService = notificationService;

  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const { allow_comment, availability, content, tags } = req.body;

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTags = await this._userRepo.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (tags.length != mentionsTags.length) {
        throw new AppError("invalid tag id");
      }
      for (const tag of mentionsTags) {
        if (tag._id.toString() == req.user?._id.toString()) {
          throw new AppError("you can not tag your self");
        }
        mentions.push(tag._id);
        (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();
    if (req?.files) {
      urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${folderId}`,
        store_type: Store_Enum.memory,
      });
    }

    const post = await this._postRepo.create({
      content: content!,
      attachments: urls,
      createdBy: req?.user?._id!,
      tags: mentions,
      folderId,
      allow_comment,
      availability,
    });

    if (!post) {
      await this._s3Service.deleteFiles(urls);
      throw new AppError("Failed to create post");
    }

    if (fcmTokens?.length) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: "you are mention on New Post",
          body: content || "",
        },
      });
    }

    successResponse({ res, data: post });
  };

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    const posts = await this._postRepo.paginate({
      page: +req?.query?.page!,
      limit: +req?.query?.limit!,
      sort: { createdAt: -1 },
      search: {
        $or: [
        ...AvailabilityPost(req),
      ],
        ...(req.query?.search
          ? {
              $or: [{ content: { $regex: req.query?.search, $options: "i" } }],
            }
          : {}),
      },
      populate: { 
        path: "comments",
        match: { 
          commentId: {$exists: false}
        },
        populate: { 
          path: "replies"
        }
      },
    });

    successResponse({ res, data: posts });
  };

  getFeed = async (req: Request, res: Response, next: NextFunction) => {
    const base = feedPostFilter(req);
    const search: Record<string, unknown> = req.query?.search
      ? {
          $and: [
            base,
            { $or: [{ content: { $regex: String(req.query.search), $options: "i" } }] },
          ],
        }
      : base;

    const posts = await this._postRepo.paginate({
      page: +req?.query?.page!,
      limit: +req?.query?.limit!,
      sort: { createdAt: -1 },
      populate: { path: "createdBy", select: "firstName lastName profilePic" },
      search,
    });

    successResponse({ res, data: posts });
  };

  getProfilePosts = async (req: Request, res: Response, next: NextFunction) => {
    const userIdRaw = req.params.userId;
    const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
    if (!userId) {
      throw new AppError("Missing userId", 400);
    }
    const profileUser = await this._userRepo.findOne({
      filter: { _id: new Types.ObjectId(userId) },
    });
    if (!profileUser) {
      throw new AppError("User not found", 404);
    }
    const friends = (profileUser.friends || []) as Types.ObjectId[];
    const isFriend = friends.some((f) => f.equals(req.user!._id));
    const filter = profilePostsFilter({
      viewerId: req.user!._id,
      profileUserId: new Types.ObjectId(userId),
      isFriend,
    });

    const posts = await this._postRepo.paginate({
      page: +req?.query?.page!,
      limit: +req?.query?.limit!,
      sort: { createdAt: -1 },
      populate: { path: "createdBy", select: "firstName lastName profilePic" },
      search: filter,
    });
    successResponse({ res, data: posts });
  };

  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    const postOid = postObjectId(req.params.postId);
    const post = await this._postRepo.findOne({
      filter: { _id: postOid, ...AvailabilityPost(req) },
    });
    if (!post) {
      throw new AppError("Post not found or not authorized", 404);
    }
    successResponse({ res, data: post });
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const postOid = postObjectId(req.params.postId);
    const permanent = req.query.permanent === "true";
    const post = await this._postRepo.findOne({
      filter: { _id: postOid, createdBy: req.user!._id },
    });
    if (!post) {
      throw new AppError("Post not found or not authorized", 404);
    }

    if (permanent) {
      if (post.attachments?.length) {
        await this._s3Service.deleteFiles(post.attachments);
      }
      await this._postRepo.findOneAndDelete({
        filter: { _id: postOid, createdBy: req.user!._id },
      });
      successResponse({ res, data: { deleted: true, permanent: true } });
      return;
    }

    await this._postRepo.findOneAndUpdate({
      filter: { _id: postOid, createdBy: req.user!._id },
      update: { $set: { deletedAt: new Date() } },
    });
    successResponse({ res, data: { deleted: true, soft: true } });
  };

  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const postOid = postObjectId(req.params.postId);
    const { flag } = req.query;

    let updateQuery: Record<string, unknown> = {
      $addToSet: { likes: req.user?._id },
    };

    if (flag && flag === "dislike") {
      updateQuery = {
        $pull: { likes: req.user?._id },
      };
    }

    const post = await this._postRepo.findOneAndUpdate({
      filter: {
        _id: postOid,
        ...AvailabilityPost(req),
      },
      update: updateQuery,
    });

    if (!post) {
      throw new AppError("Post not found or not authorized");
    }

    successResponse({ res, data: post });
  };

  setPostReaction = async (req: Request, res: Response, next: NextFunction) => {
    const postOid = postObjectId(req.params.postId);
    const { emoji } = req.body;
    const post = await this._postRepo.findOne({
      filter: { _id: postOid, ...AvailabilityPost(req) },
    });
    if (!post) {
      throw new AppError("Post not found or not authorized", 404);
    }
    const uid = req.user!._id.toString();
    const reactions = (post.reactions || []).filter((r) => r.userId.toString() !== uid);
    reactions.push({ userId: req.user!._id, emoji });
    post.reactions = reactions;
    await post.save();
    successResponse({ res, data: post });
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const postOid = postObjectId(req.params.postId);
    const { allow_comment, availability, content, tags, removeFiles, removeTags }: updatePostDto =
      req.body;

    const post = await this._postRepo.findOne({
      filter: {
        _id: postOid,
        createdBy: req?.user?._id!,
      },
    });

    if (!post) {
      throw new AppError("Post not found or not authorized");
    }

    if (removeFiles?.length) {
      const invalidFiles = removeFiles.filter((file: string) => {
        return !post.attachments?.includes(file);
      });
      if (invalidFiles?.length) {
        throw new AppError("some of path file you want to remove are not belongs to this post");
      }
      await this._s3Service.deleteFiles(removeFiles);

      post.attachments = post.attachments?.filter((file: string) => {
        return !removeFiles?.includes(file);
      }) as string[];
    }

    const updateTags = new Set(post?.tags?.map((id) => id.toString()));

    removeTags?.forEach((tag: string) => {
      return updateTags.delete(tag);
    });

    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTags = await this._userRepo.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (tags.length != mentionsTags.length) {
        throw new AppError("some person you mentioned is not exist");
      }
      for (const tag of mentionsTags) {
        if (tag._id.toString() == req.user?._id.toString()) {
          throw new AppError("you can not tag your self");
        }
        updateTags.add(tag._id.toString());
        (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
      }
    }
    post.tags = [...updateTags].map((id) => new Types.ObjectId(id));

    if (req.files?.length) {
      let urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${post.folderId}`,
        store_type: Store_Enum.memory,
      });
      post.attachments?.push(...urls);
    }

    if (fcmTokens?.length) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: "you are mention on New Post",
          body: content || "",
        },
      });
    }

    if (content) post.content = content;
    if (availability) post.availability = availability;
    if (allow_comment) post.allow_comment = allow_comment;

    await post.save();

    successResponse({ res, data: post });
  };
}

export default new PostService();
