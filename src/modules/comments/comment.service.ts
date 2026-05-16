// import { NextFunction, Request, Response } from "express";
// import { Types } from "mongoose";
// import { successResponse } from "../../common/utils/security/response.success";
// import { AppError } from "../../common/utils/global-error-handler";
// import CommentRepository from "../../DB/repositories/comment.repository";
// import postRepository from "../../DB/repositories/post.repository";
// import { AvailabilityPost } from "../../common/utils/post.utils";
// import { Allow_Comment_Enum } from "../../common/enum/post.enum";

// function routeParam(value: string | string[] | undefined, label: string): string {
//   const raw = Array.isArray(value) ? value[0] : value;
//   if (!raw) {
//     throw new AppError(`Missing ${label}`, 400);
//   }
//   return raw;
// }

// class CommentService {
//   private readonly _commentRepo = new CommentRepository();
//   private readonly _postRepo = new postRepository();

//   private async assertPostVisibleForComment(req: Request, postId: string) {
//     const post = await this._postRepo.findOne({
//       filter: { _id: postId, ...AvailabilityPost(req) },
//     });
//     if (!post) {
//       throw new AppError("Post not found or not authorized", 404);
//     }
//     if (post.allow_comment === Allow_Comment_Enum.disallow) {
//       throw new AppError("Comments are turned off for this post", 403);
//     }
//     return post;
//   }

//   listComments = async (req: Request, res: Response, next: NextFunction) => {
//     const postId = routeParam(req.params.postId, "postId");
//     await this.assertPostVisibleForComment(req, postId);
//     const comments = await this._commentRepo.find({
//       filter: { post: new Types.ObjectId(postId) },
//       options: { sort: { createdAt: 1 }, populate: { path: "createdBy", select: "firstName lastName profilePic" } },
//     });
//     successResponse({ res, data: comments });
//   };

//   createComment = async (req: Request, res: Response, next: NextFunction) => {
//     const postId = routeParam(req.params.postId, "postId");
//     const { content } = req.body;
//     await this.assertPostVisibleForComment(req, postId);
//     const comment = await this._commentRepo.create({
//       post: new Types.ObjectId(postId),
//       createdBy: req.user!._id,
//       content,
//     });
//     successResponse({ res, data: comment });
//   };

//   updateComment = async (req: Request, res: Response, next: NextFunction) => {
//     const postId = routeParam(req.params.postId, "postId");
//     const commentId = routeParam(req.params.commentId, "commentId");
//     const { content } = req.body;
//     await this.assertPostVisibleForComment(req, postId);
//     const updated = await this._commentRepo.findOneAndUpdate({
//       filter: {
//         _id: commentId,
//         post: new Types.ObjectId(postId),
//         createdBy: req.user!._id,
//       },
//       update: { $set: { content } },
//     });
//     if (!updated) {
//       throw new AppError("Comment not found or not authorized", 404);
//     }
//     successResponse({ res, data: updated });
//   };

//   deleteComment = async (req: Request, res: Response, next: NextFunction) => {
//     const postId = routeParam(req.params.postId, "postId");
//     const commentId = routeParam(req.params.commentId, "commentId");
//     const permanent = req.query.permanent === "true";
//     await this.assertPostVisibleForComment(req, postId);

//     if (permanent) {
//       const post = await this._postRepo.findOne({
//         filter: { _id: postId, ...AvailabilityPost(req) },
//       });
//       const isPostOwner = post?.createdBy?.toString() === req.user!._id.toString();
//       const filter: Record<string, unknown> = {
//         _id: commentId,
//         post: new Types.ObjectId(postId),
//       };
//       if (!isPostOwner) {
//         filter.createdBy = req.user!._id;
//       }
//       const deleted = await this._commentRepo.findOneAndDelete({
//         filter: filter as never,
//       });
//       if (!deleted) {
//         throw new AppError("Comment not found or not authorized", 404);
//       }
//       successResponse({ res, data: { deleted: true, permanent: true } });
//       return;
//     }

//     const updated = await this._commentRepo.findOneAndUpdate({
//       filter: {
//         _id: commentId,
//         post: new Types.ObjectId(postId),
//         createdBy: req.user!._id,
//       },
//       update: { $set: { deletedAt: new Date() } },
//     });
//     if (!updated) {
//       throw new AppError("Comment not found or not authorized", 404);
//     }
//     successResponse({ res, data: updated });
//   };

//   setCommentReaction = async (req: Request, res: Response, next: NextFunction) => {
//     const postId = routeParam(req.params.postId, "postId");
//     const commentId = routeParam(req.params.commentId, "commentId");
//     const { emoji } = req.body;
//     await this.assertPostVisibleForComment(req, postId);
//     const comment = await this._commentRepo.findOne({
//       filter: { _id: commentId, post: new Types.ObjectId(postId) },
//     });
//     if (!comment) {
//       throw new AppError("Comment not found", 404);
//     }
//     const uid = req.user!._id.toString();
//     const reactions = (comment.reactions || []).filter((r) => r.userId.toString() !== uid);
//     reactions.push({ userId: req.user!._id, emoji });
//     comment.reactions = reactions;
//     await comment.save();
//     successResponse({ res, data: comment });
//   };
// }

// export default new CommentService();


import { NextFunction, Request, Response } from "express";
import UserRepository from "../../DB/repositories/user.repository";
import { successResponse } from "../../common/utils/security/response.success";
import redisService from "../../common/service/redis.service";
import { S3Service } from "../../common/service/s3.service";
import notificationService from "../../common/service/notification.service";
import postRepository from "../../DB/repositories/post.repository";
import { Types, HydratedDocument } from "mongoose";
import { AppError } from "../../common/utils/global-error-handler";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { AvailabilityPost } from "../../common/utils/post.utils";
import CommentRepository from "../../DB/repositories/comment.repository";
import { Allow_Comment_Enum, On_Model_Enum } from "../../common/enum/post.enum";
import { IComment } from "../../DB/models/comment.modal";
import { IPost } from "../../DB/models/post.modal";



class CommentService {
  private readonly _userRepo = new UserRepository();
  private readonly _postRepo = new postRepository();
  private readonly _commentRepo = new CommentRepository();
  private readonly _redisService = redisService;
  private readonly _s3Service = new S3Service();
  private readonly _notificationService = notificationService;

  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { content, tags, onModel } = req.body;
    const { postId, commentId } = req.params;

    let doc: HydratedDocument<IPost | IComment> | null = null;

    if(onModel === On_Model_Enum.Post && !commentId ){
        doc = await this._postRepo.findOne({
          filter :{
            _id: postId!,
            $or: [
              ...AvailabilityPost(req)
            ],
            allow_comment: Allow_Comment_Enum.allow
          },
        });

        if (!doc) {
          throw new AppError("Post not found or you are not allowed to comment on this post");
        }
    }else if(onModel === On_Model_Enum.Comment && commentId ){
      let comment = await this._commentRepo.findOne({
          filter :{
            _id: commentId!,
            refId: postId!,
          },
        });

        await comment?.populate({
          path: "refId",
          match: {
            $or: [...AvailabilityPost(req)],
            allow_comment: Allow_Comment_Enum.allow,
          },
        });

        if (!comment?.refId) {
          throw new AppError("comment not found or you are not allowed to comment on this post");
        }
        doc = comment;
    }

    if(!doc){
        throw new AppError("Invalid onModel value", 400);
    }

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
        path: `users/${req?.user?._id}/posts/${doc?._id}/comments/${folderId}`,
        store_type: Store_Enum.memory,
      });
    }

    const comment = await this._commentRepo.create({
      content: content || "",
      attachments: urls,
      createdBy: req?.user?._id!,
      tags: mentions,
      folderId,
      refId: doc?._id!,
      onModel,
    });

    if (!comment) {
      await this._s3Service.deleteFiles(urls);
      throw new AppError("Failed to create comment");
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

    successResponse({ res, data: comment });
  };

}

export default new CommentService();

  