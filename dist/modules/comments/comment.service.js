"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const response_success_1 = require("../../common/utils/security/response.success");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const comment_repository_1 = __importDefault(require("../../DB/repositories/comment.repository"));
const post_repository_1 = __importDefault(require("../../DB/repositories/post.repository"));
const post_utils_1 = require("../../common/utils/post.utils");
const post_enum_1 = require("../../common/enum/post.enum");
function routeParam(value, label) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) {
        throw new global_error_handler_1.AppError(`Missing ${label}`, 400);
    }
    return raw;
}
class CommentService {
    _commentRepo = new comment_repository_1.default();
    _postRepo = new post_repository_1.default();
    async assertPostVisibleForComment(req, postId) {
        const post = await this._postRepo.findOne({
            filter: { _id: postId, ...(0, post_utils_1.AvailabilityPost)(req) },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found or not authorized", 404);
        }
        if (post.allow_comment === post_enum_1.Allow_Comment_Enum.disallow) {
            throw new global_error_handler_1.AppError("Comments are turned off for this post", 403);
        }
        return post;
    }
    listComments = async (req, res, next) => {
        const postId = routeParam(req.params.postId, "postId");
        await this.assertPostVisibleForComment(req, postId);
        const comments = await this._commentRepo.find({
            filter: { post: new mongoose_1.Types.ObjectId(postId) },
            options: { sort: { createdAt: 1 }, populate: { path: "createdBy", select: "firstName lastName profilePic" } },
        });
        (0, response_success_1.successResponse)({ res, data: comments });
    };
    createComment = async (req, res, next) => {
        const postId = routeParam(req.params.postId, "postId");
        const { content } = req.body;
        await this.assertPostVisibleForComment(req, postId);
        const comment = await this._commentRepo.create({
            post: new mongoose_1.Types.ObjectId(postId),
            createdBy: req.user._id,
            content,
        });
        (0, response_success_1.successResponse)({ res, data: comment });
    };
    updateComment = async (req, res, next) => {
        const postId = routeParam(req.params.postId, "postId");
        const commentId = routeParam(req.params.commentId, "commentId");
        const { content } = req.body;
        await this.assertPostVisibleForComment(req, postId);
        const updated = await this._commentRepo.findOneAndUpdate({
            filter: {
                _id: commentId,
                post: new mongoose_1.Types.ObjectId(postId),
                createdBy: req.user._id,
            },
            update: { $set: { content } },
        });
        if (!updated) {
            throw new global_error_handler_1.AppError("Comment not found or not authorized", 404);
        }
        (0, response_success_1.successResponse)({ res, data: updated });
    };
    deleteComment = async (req, res, next) => {
        const postId = routeParam(req.params.postId, "postId");
        const commentId = routeParam(req.params.commentId, "commentId");
        const permanent = req.query.permanent === "true";
        await this.assertPostVisibleForComment(req, postId);
        if (permanent) {
            const post = await this._postRepo.findOne({
                filter: { _id: postId, ...(0, post_utils_1.AvailabilityPost)(req) },
            });
            const isPostOwner = post?.createdBy?.toString() === req.user._id.toString();
            const filter = {
                _id: commentId,
                post: new mongoose_1.Types.ObjectId(postId),
            };
            if (!isPostOwner) {
                filter.createdBy = req.user._id;
            }
            const deleted = await this._commentRepo.findOneAndDelete({
                filter: filter,
            });
            if (!deleted) {
                throw new global_error_handler_1.AppError("Comment not found or not authorized", 404);
            }
            (0, response_success_1.successResponse)({ res, data: { deleted: true, permanent: true } });
            return;
        }
        const updated = await this._commentRepo.findOneAndUpdate({
            filter: {
                _id: commentId,
                post: new mongoose_1.Types.ObjectId(postId),
                createdBy: req.user._id,
            },
            update: { $set: { deletedAt: new Date() } },
        });
        if (!updated) {
            throw new global_error_handler_1.AppError("Comment not found or not authorized", 404);
        }
        (0, response_success_1.successResponse)({ res, data: updated });
    };
    setCommentReaction = async (req, res, next) => {
        const postId = routeParam(req.params.postId, "postId");
        const commentId = routeParam(req.params.commentId, "commentId");
        const { emoji } = req.body;
        await this.assertPostVisibleForComment(req, postId);
        const comment = await this._commentRepo.findOne({
            filter: { _id: commentId, post: new mongoose_1.Types.ObjectId(postId) },
        });
        if (!comment) {
            throw new global_error_handler_1.AppError("Comment not found", 404);
        }
        const uid = req.user._id.toString();
        const reactions = (comment.reactions || []).filter((r) => r.userId.toString() !== uid);
        reactions.push({ userId: req.user._id, emoji });
        comment.reactions = reactions;
        await comment.save();
        (0, response_success_1.successResponse)({ res, data: comment });
    };
}
exports.default = new CommentService();
