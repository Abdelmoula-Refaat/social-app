"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
const email_enum_1 = require("../enum/email.enum");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.REDIS_URL,
        });
        this.handleEvents();
    }
    handleEvents() {
        this.client.on("error", (err) => {
            console.error("Failed to connect to Redis", err);
        });
    }
    async connect() {
        this.client.connect();
        console.log("Connected to Redis successfully");
    }
    revoked_key = ({ userId, jti }) => {
        return `revoke_token::${userId}::${jti}`;
    };
    get_key = (userId) => {
        return `revoke_token::${userId}`;
    };
    otp_key = ({ email, subject = email_enum_1.EmailEnum.confirmEmail, }) => {
        return `otp::${email}::${subject}`;
    };
    max_otp_key = (email) => {
        return `this.otp_key::${email}`;
    };
    blocked_otp_key = (email) => {
        return `this.otp_key::${email}`;
    };
    set_value = ({ key, value, ttl, }) => {
        try {
            const data = typeof value == "string" ? value : JSON.stringify(value);
            return ttl
                ? this.client.set(key, data, { EX: ttl })
                : this.client.set(key, data);
        }
        catch (err) {
            console.error("Error setting value in Redis", err);
        }
    };
    update = async ({ key, value, ttl, }) => {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.set_value({ key, value, ttl });
        }
        catch (err) {
            console.error("failed to update value in Redis", err);
        }
    };
    getValue = async (key) => {
        try {
            try {
                return JSON.parse((await this.client.get(key)));
            }
            catch (err) {
                return await this.client.get(key);
            }
        }
        catch (err) {
            console.error("Error getting value from Redis", err);
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (err) {
            console.error("Error getting TTL from Redis", err);
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (err) {
            console.error("Error checking existence in Redis", err);
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (err) {
            console.error("Error setting expiration in Redis", err);
        }
    };
    deletekey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (err) {
            console.error("Error deleting key from Redis", err);
        }
    };
    keys = async (pattern) => {
        try {
            return await this.client.keys(pattern);
        }
        catch (err) {
            console.error("Error getting keys from Redis", err);
        }
    };
    incr = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (err) {
            console.error("Error incrementing value in Redis", err);
        }
    };
    key(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM({ userId, FCMToken }) {
        return await this.client.sAdd(this.key(userId), FCMToken);
    }
    async removeFCM({ userId, FCMToken }) {
        return await this.client.sRem(this.key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.key(userId));
    }
}
exports.default = new RedisService();
