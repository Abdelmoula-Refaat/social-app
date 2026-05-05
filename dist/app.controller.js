"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const config_service_1 = require("./config/config.service");
const global_error_handler_1 = require("./common/utils/global-error-handler");
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const connectionDB_1 = require("./DB/connectionDB");
const redis_service_1 = __importDefault(require("./common/service/redis.service"));
const s3_service_1 = require("./common/service/s3.service");
const promises_1 = require("node:stream/promises");
const response_success_1 = require("./common/utils/security/response.success");
const app = (0, express_1.default)();
const port = Number(config_service_1.PORT);
const bootstrap = async () => {
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again later.",
        handler: (req, res, next) => {
            throw new global_error_handler_1.AppError("Too many requests from this IP, please try again later.", 429);
        },
        legacyHeaders: false,
    });
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), limiter);
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Welcome on SocialMedia App........" });
    });
    app.get("/uploadDeleteFolder", async (req, res, next) => {
        const { folderName } = req.body;
        let result = await new s3_service_1.S3Service().deleteFolder(folderName);
        (0, response_success_1.successResponse)({ res, data: result });
    });
    app.get("/uploadDeleteFiles", async (req, res, next) => {
        const { keys } = req.body;
        let result = await new s3_service_1.S3Service().deleteFiles(keys);
        (0, response_success_1.successResponse)({ res, data: result });
    });
    app.get("/uploadDeleteFile", async (req, res, next) => {
        const { Key } = req.query;
        let result = await new s3_service_1.S3Service().deleteFile(Key);
        (0, response_success_1.successResponse)({ res, data: result });
    });
    app.get("/upload/", async (req, res, next) => {
        const { folderName } = req.query;
        const result = await new s3_service_1.S3Service().getFiles(folderName);
        const resultMapped = result.Contents?.map((file) => {
            return { Key: file.Key };
        });
        (0, response_success_1.successResponse)({ res, data: resultMapped });
    });
    app.get("/upload/pre-signed/*path", async (req, res, next) => {
        const { path } = req.params;
        const { download } = req.query;
        const Key = path.join("/");
        const url = await new s3_service_1.S3Service().getPresignedUrl({ Key, download: download ? download : undefined });
        (0, response_success_1.successResponse)({ res, data: url });
    });
    app.get("/upload/*path", async (req, res, next) => {
        const { path } = req.params;
        const { download } = req.query;
        const Key = path.join("/");
        const result = await new s3_service_1.S3Service().getFile(Key);
        const stream = result.Body;
        res.setHeader("Content-Type", result.ContentType);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        if (download && download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`);
        }
        await (0, promises_1.pipeline)(stream, res);
    });
    async function test() {
    }
    (0, connectionDB_1.checkConnectionDB)();
    await redis_service_1.default.connect();
    app.use("/auth", auth_controller_1.default);
    app.use("{*demo}", (req, res, next) => {
        throw new global_error_handler_1.AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });
    app.use(global_error_handler_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};
exports.default = bootstrap;
