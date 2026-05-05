"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_service_1 = require("../../config/config.service");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../enum/multer.enum");
const node_fs_1 = require("node:fs");
const global_error_handler_1 = require("../utils/global-error-handler");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_service_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_1.AWS_ACCESS_KEY,
                secretAccessKey: config_service_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile({ file, store_type = multer_enum_1.Store_Enum.memory, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            ACL,
            Key: `social_media_app_2/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            Body: store_type === multer_enum_1.Store_Enum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        });
        if (!command.input?.Key) {
            throw new global_error_handler_1.AppError("Fail to upload file");
        }
        await this.client.send(command);
        return command.input.Key;
    }
    ;
    async uploadLargeFile({ file, store_type = multer_enum_1.Store_Enum.disk, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: config_service_1.AWS_BUCKET_NAME,
                ACL,
                Key: `social_media_app_2/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                Body: store_type === multer_enum_1.Store_Enum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
                ContentType: file.mimetype,
            },
        });
        const result = await command.done();
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        return result.Key;
    }
    ;
    async uploadFiles({ files, store_type = multer_enum_1.Store_Enum.memory, path = "General", ACL = client_s3_1.ObjectCannedACL.private, isLarge = false }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ file, store_type, path, ACL });
            }));
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({ file, store_type, path, ACL });
            }));
        }
        return urls;
    }
    ;
    async createPresignedUrl({ path, fileName, contentType, expiresIn = 60, }) {
        const Key = `social_media_app_2/${path}/${(0, node_crypto_1.randomUUID)()}__${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
            ContentType: contentType,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, Key };
    }
    ;
    async getFile(Key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key
        });
        return await this.client.send(command);
    }
    ;
    async getPresignedUrl({ Key, expiresIn = 60, download }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
            ResponseContentDisposition: download ? `attachment; fileName="${Key.split("/").pop()}"` : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return url;
    }
    ;
    async getFiles(folderName) {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Prefix: `social_media_app_2/${folderName}`
        });
        return await this.client.send(command);
    }
    ;
    async deleteFile(Key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key
        });
        return await this.client.send(command);
    }
    ;
    async deleteFiles(keys) {
        const keyMapped = keys.map((k) => {
            return { Key: k };
        });
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Delete: {
                Objects: keyMapped
            },
        });
        return await this.client.send(command);
    }
    ;
    async deleteFolder(folderName) {
        const data = await this.getFiles(folderName);
        const keyMapped = data?.Contents?.map((k) => {
            return k.Key;
        });
        return await this.deleteFiles(keyMapped);
    }
    ;
}
exports.S3Service = S3Service;
