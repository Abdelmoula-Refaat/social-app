"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const encrypt_security_1 = require("../../common/utils/security/encrypt.security");
const hash_1 = require("../../common/utils/security/hash");
const send_email_1 = require("../../common/utils/email/send.email");
const email_template_1 = require("../../common/utils/email/email.template");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const email_events_1 = require("../../common/utils/email/email.events");
const email_enum_1 = require("../../common/enum/email.enum");
const response_success_1 = require("../../common/utils/security/response.success");
const user_enum_1 = require("../../common/enum/user.enum");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const token_service_1 = __importDefault(require("../../common/service/token.service"));
const crypto_1 = require("crypto");
const config_service_1 = require("../../config/config.service");
const redis_service_2 = __importDefault(require("../../common/service/redis.service"));
class UserService {
    _userRepo = new user_repository_1.default();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    constructor() { }
    sendEmailOtp = async ({ email, subject }) => {
        const isBlocked = await redis_service_2.default.ttl(redis_service_2.default.blocked_otp_key(email));
        if (isBlocked && isBlocked > 0) {
            throw new global_error_handler_1.AppError(`You are blocked from requesting OTP. Please try again after ${isBlocked} seconds`, 429);
        }
        const ttlOtp = await redis_service_2.default.ttl(redis_service_2.default.otp_key({ email, subject }));
        if (ttlOtp && ttlOtp > 0) {
            throw new global_error_handler_1.AppError(`OTP already sent. Please try again after ${ttlOtp} seconds`, 429);
        }
        if (await redis_service_2.default.getValue(redis_service_2.default.max_otp_key(email)) >= "3") {
            await redis_service_2.default.set_value({
                key: redis_service_2.default.blocked_otp_key(email),
                value: "1",
                ttl: 15 * 30,
            });
            throw new global_error_handler_1.AppError("You have exceeded the maximum number of OTP requests", 429);
        }
        const otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(email_enum_1.EmailEnum.confirmEmail, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "hello from social media app",
                html: (0, email_template_1.emailTemplate)(otp),
            });
            await redis_service_2.default.set_value({
                key: redis_service_2.default.otp_key({
                    email,
                    subject,
                }),
                value: (0, hash_1.Hash)({ plain_text: `${otp}` }),
                ttl: 60 * 2,
            });
            await redis_service_2.default.incr(redis_service_2.default.max_otp_key(email));
        });
    };
    signup = async (req, res, next) => {
        let { firstName, lastName, email, password, cPassword, age, gender, address, phone, } = req.body;
        if (await this._userRepo.findOne({ filter: { email } })) {
            throw new global_error_handler_1.AppError("Email already exists", 409);
        }
        const user = await this._userRepo.create({
            firstName,
            lastName,
            email,
            password: (0, hash_1.Hash)({ plain_text: password }),
            age,
            gender,
            address,
            phone: phone ? (0, encrypt_security_1.encrypt)(phone) : null,
        });
        const otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(email_enum_1.EmailEnum.confirmEmail, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "Confirm your email",
                html: (0, email_template_1.emailTemplate)(otp),
            });
            await this._redisService.set_value({
                key: this._redisService.otp_key({
                    email,
                    subject: email_enum_1.EmailEnum.confirmEmail,
                }),
                value: (0, hash_1.Hash)({ plain_text: `${otp}` }),
            });
            await this._redisService.set_value({
                key: this._redisService.max_otp_key(email),
                value: "1",
                ttl: 60 * 30,
            });
        });
        res
            .status(200)
            .json({ message: "User signed up successfully", data: user });
    };
    confirmEmail = async (req, res, next) => {
        const { email, code } = req.body;
        const otpvalue = await this._redisService.getValue(this._redisService.otp_key({ email }));
        if (!otpvalue) {
            throw new global_error_handler_1.AppError("OTP expired", 400);
        }
        if (!(0, hash_1.Compare)({ plain_text: code, cipher_text: otpvalue })) {
            throw new global_error_handler_1.AppError("Invalid OTP", 400);
        }
        const user = await this._userRepo.findOneAndUpdate({
            filter: {
                email,
                confrimed: { $exists: false },
                provider: user_enum_1.ProviderEnum.local,
            },
            update: { confrimed: true },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("User not found or already confirmed", 404);
        }
        await this._redisService.deletekey(this._redisService.otp_key({ email }));
        (0, response_success_1.successResponse)({
            res,
            message: "Email confirmed successfully",
            data: user,
        });
    };
    signin = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userRepo.findOne({
            filter: {
                email,
                provider: user_enum_1.ProviderEnum.local,
                confrimed: { $exists: true },
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("User not exist or invalid provider", 400);
        }
        if (!(0, hash_1.Compare)({ plain_text: password, cipher_text: user.password })) {
            throw new global_error_handler_1.AppError("Invalid password", 400);
        }
        const uuid = (0, crypto_1.randomUUID)();
        const access_Token = this._tokenService.GenerateToken({
            payload: {
                id: user._id,
                email: user.email,
            },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.ACCESS_SECRET_KEY_USER
                : config_service_1.ACCESS_SECRET_KEY_Admin,
            options: {
                expiresIn: "1day",
                jwtid: uuid,
            },
        });
        const refresh_Token = this._tokenService.GenerateToken({
            payload: {
                id: user._id,
                email: user.email,
            },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.REFRESH_SECRET_KEY_USER
                : config_service_1.REFRESH_SECRET_KEY_Admin,
            options: {
                expiresIn: "1y",
                jwtid: uuid,
            },
        });
        (0, response_success_1.successResponse)({
            res,
            message: "User signed in successfully",
            data: { access_Token, refresh_Token },
        });
    };
    getProfile = async (req, res, next) => {
        (0, response_success_1.successResponse)({
            res,
            message: "User profile retrieved successfully",
            data: { user: req.user },
        });
    };
}
exports.default = new UserService();
