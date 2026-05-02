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
const user_modal_1 = __importDefault(require("./DB/models/user.modal"));
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
    async function test() {
        const user = new user_modal_1.default({});
        await user.updateOne({ $set: { x: 'test' } });
        console.log("user updated");
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
