import { createClient, RedisClientType } from "redis";
import { REDIS_URL } from "../../config/config.service";
import { EmailEnum } from "../enum/email.enum";
import { Types } from "mongoose";

class RedisService {
  private readonly client: RedisClientType;
  constructor() {
    this.client = createClient({
      url: REDIS_URL,
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

  revoked_key = ({ userId, jti }: { userId: Types.ObjectId; jti: string }) => {
    return `revoke_token::${userId}::${jti}`;
  };

  get_key = (userId: Types.ObjectId) => {
    return `revoke_token::${userId}`;
  };

  otp_key = ({
    email,
    subject = EmailEnum.confirmEmail,
  }: {
    email: string;
    subject?: EmailEnum;
  }) => {
    return `otp::${email}::${subject}`;
  };

  max_otp_key = (email: string) => {
    return `this.otp_key::${email}`;
  };

  blocked_otp_key = (email: string) => {
    return `this.otp_key::${email}`;
  };

  set_value = ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object;
    ttl?: number;
  }) => {
    try {
      const data = typeof value == "string" ? value : JSON.stringify(value);
      return ttl
        ? this.client.set(key, data, { EX: ttl })
        : this.client.set(key, data);
    } catch (err) {
      console.error("Error setting value in Redis", err);
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string;
    ttl: number;
  }) => {
    try {
      if (!(await this.client.exists(key))) return 0;
      return await this.set_value({ key, value, ttl });
    } catch (err) {
      console.error("failed to update value in Redis", err);
    }
  };

  getValue = async (key: string) => {
    try {
      try {
        return JSON.parse((await this.client.get(key)) as string);
      } catch (err) {
        return await this.client.get(key);
      }
    } catch (err) {
      console.error("Error getting value from Redis", err);
    }
  };

  ttl = async (key: string) => {
    try {
      return await this.client.ttl(key);
    } catch (err) {
      console.error("Error getting TTL from Redis", err);
    }
  };

  exists = async (key: string) => {
    try {
      return await this.client.exists(key);
    } catch (err) {
      console.error("Error checking existence in Redis", err);
    }
  };

  expire = async ({ key, ttl }: { key: string; ttl: number }) => {
    try {
      return await this.client.expire(key, ttl);
    } catch (err) {
      console.error("Error setting expiration in Redis", err);
    }
  };

  deletekey = async (key: string) => {
    try {
      if (!key.length) return 0;
      return await this.client.del(key);
    } catch (err) {
      console.error("Error deleting key from Redis", err);
    }
  };

  keys = async (pattern: string) => {
    try {
      return await this.client.keys(pattern);
    } catch (err) {
      console.error("Error getting keys from Redis", err);
    }
  };

  incr = async (key: string) => {
    try {
      return await this.client.incr(key);
    } catch (err) {
      console.error("Error incrementing value in Redis", err);
    }
  };

  key(userId: Types.ObjectId){
    return `user:FCM:${userId}`;
  }

  async addFCM({ userId, FCMToken } : { userId: Types.ObjectId, FCMToken: string}){

    return await this.client.sAdd(this.key(userId), FCMToken);
  }

  async removeFCM({ userId, FCMToken } : { userId: Types.ObjectId, FCMToken: string}){

    return await this.client.sRem(this.key(userId), FCMToken);
  }

  async getFCMs( userId: Types.ObjectId ){

    return await this.client.sMembers(this.key(userId));
  }

  async hasFCMs( userId: Types.ObjectId ){

    return await this.client.sCard(this.key(userId));
  }

  async removeFCMUser( userId: Types.ObjectId){

    return await this.client.del(this.key(userId));
  }


  socketKey(userId: Types.ObjectId){
    return `user:socket:${userId}`;
  }

  async addSocket({ userId, SocketId } : { userId: Types.ObjectId, SocketId: string}){

    return await this.client.sAdd(this.socketKey(userId), SocketId);
  }

  async removeSocket({ userId, SocketId } : { userId: Types.ObjectId, SocketId: string}){

    return await this.client.sRem(this.socketKey(userId), SocketId);
  }

  async getSockets( userId: Types.ObjectId ){

    return await this.client.sMembers(this.socketKey(userId));
  }

  async hasSockets( userId: Types.ObjectId ){

    return await this.client.sCard(this.socketKey(userId));
  }

  async removeSocketsUser( userId: Types.ObjectId){

    return await this.client.del(this.socketKey(userId));
  }
  
}

export default new RedisService();
