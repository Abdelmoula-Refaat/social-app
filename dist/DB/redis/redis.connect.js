"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
exports.redisClient = (0, redis_1.createClient)({
    url: config_service_1.REDIS_URL
});
const connectRedis = async () => {
    await exports.redisClient.connect()
        .then(() => {
        console.log("Connected to Redis successfully");
    }).catch((err) => {
        console.error("Failed to connect to Redis", err);
    });
};
exports.connectRedis = connectRedis;
