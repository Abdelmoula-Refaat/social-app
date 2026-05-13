import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { successResponse } from "../../common/utils/security/response.success";
import { AppError } from "../../common/utils/global-error-handler";
import CommentRepository from "../../DB/repositories/comment.repository";
import postRepository from "../../DB/repositories/post.repository";
import { AvailabilityPost } from "../../common/utils/post.utils";
import { Allow_Comment_Enum } from "../../common/enum/post.enum";

function routeParam(value: string | string[] | undefined, label: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    throw new AppError(`Missing ${label}`, 400);
  }
  return raw;
}

class CommentService {
  private readonly _commentRepo = new CommentRepository();
  private readonly _postRepo = new postRepository();

  private async assertPostVisibleForComment(req: Request, postId: string) {
    const post = await this._postRepo.findOne({
      filter: { _id: postId, ...AvailabilityPost(req) },
    });
    if (!post) {
      throw new AppError("Post not found or not authorized", 404);
    }
    if (post.allow_comment === Allow_Comment_Enum.disallow) {
      throw new AppError("Comments are turned off for this post", 403);
    }
    return post;
  }

  listComments = async (req: Request, res: Response, next: NextFunction) => {
    const postId = routeParam(req.params.postId, "postId");
    await this.assertPostVisibleForComment(req, postId);
    const comments = await this._commentRepo.find({
      filter: { post: new Types.ObjectId(postId) },
      options: { sort: { createdAt: 1 }, populate: { path: "createdBy", select: "firstName lastName profilePic" } },
    });
    successResponse({ res, data: comments });
  };

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const postId = routeParam(req.params.postId, "postId");
    const { content } = req.body;
    await this.assertPostVisibleForComment(req, postId);
    const comment = await this._commentRepo.create({
      post: new Types.ObjectId(postId),
      createdBy: req.user!._id,
      content,
    });
    successResponse({ res, data: comment });
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    const postId = routeParam(req.params.postId, "postId");
    const commentId = routeParam(req.params.commentId, "commentId");
    const { content } = req.body;
    await this.assertPostVisibleForComment(req, postId);
    const updated = await this._commentRepo.findOneAndUpdate({
      filter: {
        _id: commentId,
        post: new Types.ObjectId(postId),
        createdBy: req.user!._id,
      },
      update: { $set: { content } },
    });
    if (!updated) {
      throw new AppError("Comment not found or not authorized", 404);
    }
    successResponse({ res, data: updated });
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    const postId = routeParam(req.params.postId, "postId");
    const commentId = routeParam(req.params.commentId, "commentId");
    const permanent = req.query.permanent === "true";
    await this.assertPostVisibleForComment(req, postId);

    if (permanent) {
      const post = await this._postRepo.findOne({
        filter: { _id: postId, ...AvailabilityPost(req) },
      });
      const isPostOwner = post?.createdBy?.toString() === req.user!._id.toString();
      const filter: Record<string, unknown> = {
        _id: commentId,
        post: new Types.ObjectId(postId),
      };
      if (!isPostOwner) {
        filter.createdBy = req.user!._id;
      }
      const deleted = await this._commentRepo.findOneAndDelete({
        filter: filter as never,
      });
      if (!deleted) {
        throw new AppError("Comment not found or not authorized", 404);
      }
      successResponse({ res, data: { deleted: true, permanent: true } });
      return;
    }

    const updated = await this._commentRepo.findOneAndUpdate({
      filter: {
        _id: commentId,
        post: new Types.ObjectId(postId),
        createdBy: req.user!._id,
      },
      update: { $set: { deletedAt: new Date() } },
    });
    if (!updated) {
      throw new AppError("Comment not found or not authorized", 404);
    }
    successResponse({ res, data: updated });
  };

  setCommentReaction = async (req: Request, res: Response, next: NextFunction) => {
    const postId = routeParam(req.params.postId, "postId");
    const commentId = routeParam(req.params.commentId, "commentId");
    const { emoji } = req.body;
    await this.assertPostVisibleForComment(req, postId);
    const comment = await this._commentRepo.findOne({
      filter: { _id: commentId, post: new Types.ObjectId(postId) },
    });
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }
    const uid = req.user!._id.toString();
    const reactions = (comment.reactions || []).filter((r) => r.userId.toString() !== uid);
    reactions.push({ userId: req.user!._id, emoji });
    comment.reactions = reactions;
    await comment.save();
    successResponse({ res, data: comment });
  };
}

export default new CommentService();
