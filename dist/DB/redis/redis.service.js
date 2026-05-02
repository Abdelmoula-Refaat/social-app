"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incr =
  exports.keys =
  exports.deletekey =
  exports.expire =
  exports.exists =
  exports.ttl =
  exports.getValue =
  exports.update =
  exports.set_value =
  exports.blocked_otp_key =
  exports.max_otp_key =
  exports.otp_key =
  exports.get_key =
  exports.revoked_key =
    void 0;
const event_enum_1 = require("../../common/enum/event.enum");
const redis_connect_1 = require("./redis.connect");
const revoked_key = ({ userId, jti }) => {
  return `revoke_token::${userId}::${jti}`;
};
exports.revoked_key = revoked_key;
const get_key = (userId) => {
  return `revoke_token::${userId}`;
};
exports.get_key = get_key;
const otp_key = ({ email, subject = event_enum_1.EmailEnum.confirmEmail }) => {
  return `otp::${email}::${subject}`;
};
exports.otp_key = otp_key;
const max_otp_key = (email) => {
  return `otp_key::${email}`;
};
exports.max_otp_key = max_otp_key;
const blocked_otp_key = (email) => {
  return `otp_key::${email}`;
};
exports.blocked_otp_key = blocked_otp_key;
const set_value = ({ key, value, ttl }) => {
  try {
    const data = typeof value == "string" ? value : JSON.stringify(value);
    return ttl
      ? redis_connect_1.redisClient.set(key, data, { EX: ttl })
      : redis_connect_1.redisClient.set(key, data);
  } catch (err) {
    console.error("Error setting value in Redis", err);
  }
};
exports.set_value = set_value;
const update = async ({ key, value, ttl }) => {
  try {
    if (!(await redis_connect_1.redisClient.exists(key))) return 0;
    return await (0, exports.set_value)({ key, value, ttl });
  } catch (err) {
    console.error("failed to update value in Redis", err);
  }
};
exports.update = update;
const getValue = async (key) => {
  try {
    try {
      return JSON.parse(await redis_connect_1.redisClient.get(key));
    } catch (err) {
      return await redis_connect_1.redisClient.get(key);
    }
  } catch (err) {
    console.error("Error getting value from Redis", err);
  }
};
exports.getValue = getValue;
const ttl = async (key) => {
  try {
    return await redis_connect_1.redisClient.ttl(key);
  } catch (err) {
    console.error("Error getting TTL from Redis", err);
  }
};
exports.ttl = ttl;
const exists = async (key) => {
  try {
    return await redis_connect_1.redisClient.exists(key);
  } catch (err) {
    console.error("Error checking existence in Redis", err);
  }
};
exports.exists = exists;
const expire = async ({ key, ttl }) => {
  try {
    return await redis_connect_1.redisClient.expire(key, ttl);
  } catch (err) {
    console.error("Error setting expiration in Redis", err);
  }
};
exports.expire = expire;
const deletekey = async (key) => {
  try {
    if (!key.length) return 0;
    return await redis_connect_1.redisClient.del(key);
  } catch (err) {
    console.error("Error deleting key from Redis", err);
  }
};
exports.deletekey = deletekey;
const keys = async (pattern) => {
  try {
    return await redis_connect_1.redisClient.keys(pattern);
  } catch (err) {
    console.error("Error getting keys from Redis", err);
  }
};
exports.keys = keys;
const incr = async (key) => {
  try {
    return await redis_connect_1.redisClient.incr(key);
  } catch (err) {
    console.error("Error incrementing value in Redis", err);
  }
};
exports.incr = incr;
