"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const graphql_1 = require("graphql");
const express_2 = require("graphql-http/lib/use/express");
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
const post_controller_1 = __importDefault(require("./modules/posts/post.controller"));
const story_controller_1 = __importDefault(require("./modules/stories/story.controller"));
const notifications_controller_1 = require("./modules/notifications/notifications.controller");
const dashboard_controller_1 = __importDefault(require("./modules/dashboard/dashboard.controller"));
const users_controller_1 = __importDefault(require("./modules/users/users.controller"));
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
    const users = [
        { id: 1, name: "omar", age: 25 },
        { id: 2, name: "ahmed", age: 28 },
        { id: 3, name: "ali", age: 26 }
    ];
    let queryObject = new graphql_1.GraphQLObjectType({
        name: "getUser",
        fields: {
            id: { type: graphql_1.GraphQLInt },
            name: { type: graphql_1.GraphQLString },
            age: { type: graphql_1.GraphQLInt }
        }
    });
    const schema = new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: "queryRoot",
            fields: {
                getUser: {
                    type: queryObject,
                    args: { name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) } },
                    resolve: (parent, args) => {
                        const { name } = args;
                        const user = users.find((user) => user.name === name);
                        if (!user) {
                            throw new global_error_handler_1.AppError("User not exist");
                        }
                        return user;
                    }
                },
                listUsers: {
                    type: new graphql_1.GraphQLList(queryObject),
                    resolve: () => {
                        return users;
                    }
                }
            }
        })
    });
    app.use("/graphql", (0, express_2.createHandler)({ schema }));
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
    app.use("/posts", post_controller_1.default);
    app.use("/stories", story_controller_1.default);
    app.use("/notifications", notifications_controller_1.userNotificationsRouter);
    app.use("/admin/notifications", notifications_controller_1.adminNotificationsRouter);
    app.use("/admin/dashboard", dashboard_controller_1.default);
    app.use("/users", users_controller_1.default);
    app.use("{*demo}", (req, res, next) => {
        throw new global_error_handler_1.AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });
    app.use(global_error_handler_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};
exports.default = bootstrap;
