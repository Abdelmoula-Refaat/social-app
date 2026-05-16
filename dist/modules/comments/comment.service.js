"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const response_success_1 = require("../../common/utils/security/response.success");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const s3_service_1 = require("../../common/service/s3.service");
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
const post_repository_1 = __importDefault(require("../../DB/repositories/post.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_utils_1 = require("../../common/utils/post.utils");
const comment_repository_1 = __importDefault(require("../../DB/repositories/comment.repository"));
const post_enum_1 = require("../../common/enum/post.enum");
class CommentService {
    _userRepo = new user_repository_1.default();
    _postRepo = new post_repository_1.default();
    _commentRepo = new comment_repository_1.default();
    _redisService = redis_service_1.default;
    _s3Service = new s3_service_1.S3Service();
    _notificationService = notification_service_1.default;
    constructor() { }
    createComment = async (req, res, next) => {
        const { content, tags, onModel } = req.body;
        const { postId, commentId } = req.params;
        let doc = null;
        if (onModel === post_enum_1.On_Model_Enum.Post && !commentId) {
            doc = await this._postRepo.findOne({
                filter: {
                    _id: postId,
                    $or: [
                        ...(0, post_utils_1.AvailabilityPost)(req)
                    ],
                    allow_comment: post_enum_1.Allow_Comment_Enum.allow
                },
            });
            if (!doc) {
                throw new global_error_handler_1.AppError("Post not found or you are not allowed to comment on this post");
            }
        }
        else if (onModel === post_enum_1.On_Model_Enum.Comment && commentId) {
            let comment = await this._commentRepo.findOne({
                filter: {
                    _id: commentId,
                    refId: postId,
                },
            });
            await comment?.populate({
                path: "refId",
                match: {
                    $or: [...(0, post_utils_1.AvailabilityPost)(req)],
                    allow_comment: post_enum_1.Allow_Comment_Enum.allow,
                },
            });
            if (!comment?.refId) {
                throw new global_error_handler_1.AppError("comment not found or you are not allowed to comment on this post");
            }
            doc = comment;
        }
        if (!doc) {
            throw new global_error_handler_1.AppError("Invalid onModel value", 400);
        }
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionsTags = await this._userRepo.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (tags.length != mentionsTags.length) {
                throw new global_error_handler_1.AppError("invalid tag id");
            }
            for (const tag of mentionsTags) {
                if (tag._id.toString() == req.user?._id.toString()) {
                    throw new global_error_handler_1.AppError("you can not tag your self");
                }
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${doc?._id}/comments/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory,
            });
        }
        const comment = await this._commentRepo.create({
            content: content || "",
            attachments: urls,
            createdBy: req?.user?._id,
            tags: mentions,
            folderId,
            refId: doc?._id,
            onModel,
        });
        if (!comment) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handler_1.AppError("Failed to create comment");
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
        (0, response_success_1.successResponse)({ res, data: comment });
    };
}
exports.default = new CommentService();
