import { resolve } from "path";
import { config } from "dotenv";

const NODE_ENV = process.env.NODE_ENV;
config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });

export const PORT:number = Number(process.env.PORT) || 7000;
export const MONGO_URI:string = process.env.MONGO_URI!;
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
export const EMAIL = process.env.EMAIL!;
export const PASSWORD = process.env.PASSWORD!;
export const REDIS_URL = process.env.REDIS_URL!;

export const ACCESS_SECRET_KEY_USER = process.env.ACCESS_SECRET_KEY_USER;
export const ACCESS_SECRET_KEY_Admin = process.env.ACCESS_SECRET_KEY_Admin;
export const REFRESH_SECRET_KEY_USER = process.env.REFRESH_SECRET_KEY_USER;
export const REFRESH_SECRET_KEY_Admin = process.env.REFRESH_SECRET_KEY_Admin;
export const PERFIX_USER = process.env.PERFIX_USER;
export const PERFIX_Admin = process.env.PERFIX_Admin;
export const ORIGINS = process.env.ORIGINS?.split(",") || [];
export const EXPIRES_TOKEN = 60 * 30;
export const CLIENT_ID = process.env.CLIENT_ID;

export const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;


export const AWS_REGION = process.env.AWS_REGION!;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY!;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;