"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const response_success_1 = require("../../common/utils/security/response.success");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const story_repository_1 = __importDefault(require("../../DB/repositories/story.repository"));
const s3_service_1 = require("../../common/service/s3.service");
const multer_enum_1 = require("../../common/enum/multer.enum");
const story_enum_1 = require("../../common/enum/story.enum");
const node_crypto_1 = require("node:crypto");
class StoryService {
    _storyRepo = new story_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    createStory = async (req, res, next) => {
        const folderId = (0, node_crypto_1.randomUUID)();
        let urls = [];
        if (req.files?.length) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req.user._id}/stories/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory,
            });
        }
        if (!urls.length) {
            throw new global_error_handler_1.AppError("At least one media file is required", 400);
        }
        const story = await this._storyRepo.create({
            createdBy: req.user._id,
            attachments: urls,
            expiresAt: new Date(Date.now() + story_enum_1.STORY_TTL_HOURS * 60 * 60 * 1000),
        });
        (0, response_success_1.successResponse)({ res, data: story });
    };
    listMine = async (req, res, next) => {
        const stories = await this._storyRepo.paginate({
            page: +req.query.page,
            limit: +req.query.limit,
            sort: { createdAt: -1 },
            search: { createdBy: req.user._id, expiresAt: { $gt: new Date() } },
        });
        (0, response_success_1.successResponse)({ res, data: stories });
    };
    feed = async (req, res, next) => {
        const me = req.user._id;
        const network = [me, ...(req.user.friends || [])];
        const stories = await this._storyRepo.paginate({
            page: +req.query.page,
            limit: +req.query.limit,
            sort: { createdAt: -1 },
            populate: { path: "createdBy", select: "firstName lastName profilePic" },
            search: {
                createdBy: { $in: network },
                expiresAt: { $gt: new Date() },
            },
        });
        (0, response_success_1.successResponse)({ res, data: stories });
    };
    deleteStory = async (req, res, next) => {
        const storyIdRaw = req.params.storyId;
        const storyIdStr = Array.isArray(storyIdRaw) ? storyIdRaw[0] : storyIdRaw;
        if (!storyIdStr) {
            throw new global_error_handler_1.AppError("Missing storyId", 400);
        }
        const storyOid = new mongoose_1.Types.ObjectId(storyIdStr);
        const story = await this._storyRepo.findOne({
            filter: { _id: storyOid, createdBy: req.user._id },
        });
        if (!story) {
            throw new global_error_handler_1.AppError("Story not found or not authorized", 404);
        }
        if (story.attachments?.length) {
            await this._s3Service.deleteFiles(story.attachments);
        }
        await this._storyRepo.findOneAndDelete({
            filter: { _id: storyOid, createdBy: req.user._id },
        });
        (0, response_success_1.successResponse)({ res, data: { deleted: true } });
    };
}
exports.default = new StoryService();
