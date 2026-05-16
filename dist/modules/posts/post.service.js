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
const mongoose_1 = require("mongoose");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_utils_1 = require("../../common/utils/post.utils");
function postObjectId(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) {
        throw new global_error_handler_1.AppError("Missing postId", 400);
    }
    return new mongoose_1.Types.ObjectId(raw);
}
class PostService {
    _userRepo = new user_repository_1.default();
    _postRepo = new post_repository_1.default();
    _redisService = redis_service_1.default;
    _s3Service = new s3_service_1.S3Service();
    _notificationService = notification_service_1.default;
    constructor() { }
    createPost = async (req, res, next) => {
        const { allow_comment, availability, content, tags } = req.body;
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
                path: `users/${req?.user?._id}/posts/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory,
            });
        }
        const post = await this._postRepo.create({
            content: content,
            attachments: urls,
            createdBy: req?.user?._id,
            tags: mentions,
            folderId,
            allow_comment,
            availability,
        });
        if (!post) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handler_1.AppError("Failed to create post");
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
        (0, response_success_1.successResponse)({ res, data: post });
    };
    getPosts = async (req, res, next) => {
        const posts = await this._postRepo.paginate({
            page: +req?.query?.page,
            limit: +req?.query?.limit,
            sort: { createdAt: -1 },
            search: {
                $or: [
                    ...(0, post_utils_1.AvailabilityPost)(req),
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
                    commentId: { $exists: false }
                },
                populate: {
                    path: "replies"
                }
            },
        });
        (0, response_success_1.successResponse)({ res, data: posts });
    };
    getFeed = async (req, res, next) => {
        const base = (0, post_utils_1.feedPostFilter)(req);
        const search = req.query?.search
            ? {
                $and: [
                    base,
                    { $or: [{ content: { $regex: String(req.query.search), $options: "i" } }] },
                ],
            }
            : base;
        const posts = await this._postRepo.paginate({
            page: +req?.query?.page,
            limit: +req?.query?.limit,
            sort: { createdAt: -1 },
            populate: { path: "createdBy", select: "firstName lastName profilePic" },
            search,
        });
        (0, response_success_1.successResponse)({ res, data: posts });
    };
    getProfilePosts = async (req, res, next) => {
        const userIdRaw = req.params.userId;
        const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
        if (!userId) {
            throw new global_error_handler_1.AppError("Missing userId", 400);
        }
        const profileUser = await this._userRepo.findOne({
            filter: { _id: new mongoose_1.Types.ObjectId(userId) },
        });
        if (!profileUser) {
            throw new global_error_handler_1.AppError("User not found", 404);
        }
        const friends = (profileUser.friends || []);
        const isFriend = friends.some((f) => f.equals(req.user._id));
        const filter = (0, post_utils_1.profilePostsFilter)({
            viewerId: req.user._id,
            profileUserId: new mongoose_1.Types.ObjectId(userId),
            isFriend,
        });
        const posts = await this._postRepo.paginate({
            page: +req?.query?.page,
            limit: +req?.query?.limit,
            sort: { createdAt: -1 },
            populate: { path: "createdBy", select: "firstName lastName profilePic" },
            search: filter,
        });
        (0, response_success_1.successResponse)({ res, data: posts });
    };
    getPostById = async (req, res, next) => {
        const postOid = postObjectId(req.params.postId);
        const post = await this._postRepo.findOne({
            filter: { _id: postOid, ...(0, post_utils_1.AvailabilityPost)(req) },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found or not authorized", 404);
        }
        (0, response_success_1.successResponse)({ res, data: post });
    };
    deletePost = async (req, res, next) => {
        const postOid = postObjectId(req.params.postId);
        const permanent = req.query.permanent === "true";
        const post = await this._postRepo.findOne({
            filter: { _id: postOid, createdBy: req.user._id },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found or not authorized", 404);
        }
        if (permanent) {
            if (post.attachments?.length) {
                await this._s3Service.deleteFiles(post.attachments);
            }
            await this._postRepo.findOneAndDelete({
                filter: { _id: postOid, createdBy: req.user._id },
            });
            (0, response_success_1.successResponse)({ res, data: { deleted: true, permanent: true } });
            return;
        }
        await this._postRepo.findOneAndUpdate({
            filter: { _id: postOid, createdBy: req.user._id },
            update: { $set: { deletedAt: new Date() } },
        });
        (0, response_success_1.successResponse)({ res, data: { deleted: true, soft: true } });
    };
    likePost = async (req, res, next) => {
        const postOid = postObjectId(req.params.postId);
        const { flag } = req.query;
        let updateQuery = {
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
                ...(0, post_utils_1.AvailabilityPost)(req),
            },
            update: updateQuery,
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found or not authorized");
        }
        (0, response_success_1.successResponse)({ res, data: post });
    };
    setPostReaction = async (req, res, next) => {
        const postOid = postObjectId(req.params.postId);
        const { emoji } = req.body;
        const post = await this._postRepo.findOne({
            filter: { _id: postOid, ...(0, post_utils_1.AvailabilityPost)(req) },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found or not authorized", 404);
        }
        const uid = req.user._id.toString();
        const reactions = (post.reactions || []).filter((r) => r.userId.toString() !== uid);
        reactions.push({ userId: req.user._id, emoji });
        post.reactions = reactions;
        await post.save();
        (0, response_success_1.successResponse)({ res, data: post });
    };
    updatePost = async (req, res, next) => {
        const postOid = postObjectId(req.params.postId);
        const { allow_comment, availability, content, tags, removeFiles, removeTags } = req.body;
        const post = await this._postRepo.findOne({
            filter: {
                _id: postOid,
                createdBy: req?.user?._id,
            },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found or not authorized");
        }
        if (removeFiles?.length) {
            const invalidFiles = removeFiles.filter((file) => {
                return !post.attachments?.includes(file);
            });
            if (invalidFiles?.length) {
                throw new global_error_handler_1.AppError("some of path file you want to remove are not belongs to this post");
            }
            await this._s3Service.deleteFiles(removeFiles);
            post.attachments = post.attachments?.filter((file) => {
                return !removeFiles?.includes(file);
            });
        }
        const updateTags = new Set(post?.tags?.map((id) => id.toString()));
        removeTags?.forEach((tag) => {
            return updateTags.delete(tag);
        });
        let fcmTokens = [];
        if (tags?.length) {
            const mentionsTags = await this._userRepo.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (tags.length != mentionsTags.length) {
                throw new global_error_handler_1.AppError("some person you mentioned is not exist");
            }
            for (const tag of mentionsTags) {
                if (tag._id.toString() == req.user?._id.toString()) {
                    throw new global_error_handler_1.AppError("you can not tag your self");
                }
                updateTags.add(tag._id.toString());
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        post.tags = [...updateTags].map((id) => new mongoose_1.Types.ObjectId(id));
        if (req.files?.length) {
            let urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${post.folderId}`,
                store_type: multer_enum_1.Store_Enum.memory,
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
        if (content)
            post.content = content;
        if (availability)
            post.availability = availability;
        if (allow_comment)
            post.allow_comment = allow_comment;
        await post.save();
        (0, response_success_1.successResponse)({ res, data: post });
    };
}
exports.default = new PostService();
