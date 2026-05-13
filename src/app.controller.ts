import express from "express";
import type { Response, Request, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { PORT } from "./config/config.service";
import { AppError, globalErrorHandler } from "./common/utils/global-error-handler";
import authRouter from "./modules/auth/auth.controller";
import { checkConnectionDB } from "./DB/connectionDB";
import RedisService from "./common/service/redis.service";
import { S3Service } from "./common/service/s3.service";
import { pipeline } from "node:stream/promises";
import { successResponse } from "./common/utils/security/response.success";
import postRouter from "./modules/posts/post.controller";
import storyRouter from "./modules/stories/story.controller";
import {
  userNotificationsRouter,
  adminNotificationsRouter,
} from "./modules/notifications/notifications.controller";
import dashboardRouter from "./modules/dashboard/dashboard.controller";
import usersRouter from "./modules/users/users.controller";

const app: express.Application = express();
const port:number = Number(PORT);

const bootstrap = async () => {

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 100,
        message: "Too many requests from this IP, please try again later.",
        handler: (req: Request, res: Response, next: NextFunction) => {
            throw new AppError("Too many requests from this IP, please try again later.", 429);
        },
        legacyHeaders: false,
    });

    app.use(express.json());
    app.use(cors(), helmet(), limiter);

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ message: "Welcome on SocialMedia App........" });
    });

    // app.post("/send-notification", async (req: Request, res: Response, next: NextFunction) => {
        
    //     await notificationService.sendNotification({
    //         token: req.body.token,
    //         data: {
    //             title: "Hello",
    //             body: "Welcome on SocialMedia App........"
    //         }
    //     })
    //     console.log({ token: req.body.token});
    // });


    app.get("/uploadDeleteFolder", async (req: Request, res: Response, next: NextFunction) => {
        const { folderName } = req.body as {folderName: string};

        let result = await new S3Service().deleteFolder(folderName);
        successResponse({ res, data: result });
        
    });

    app.get("/uploadDeleteFiles", async (req: Request, res: Response, next: NextFunction) => {
        const { keys } = req.body as {keys: string[]};

        let result = await new S3Service().deleteFiles(keys);
        successResponse({ res, data: result });
        
    });

     app.get("/uploadDeleteFile", async (req: Request, res: Response, next: NextFunction) => {
        const { Key } = req.query as {Key: string};

        let result = await new S3Service().deleteFile(Key);
        successResponse({ res, data: result });
        
     });

     app.get("/upload/", async (req: Request, res: Response, next: NextFunction) => {
        const { folderName } = req.query as {folderName: string};

        const result = await new S3Service().getFiles(folderName);
        const resultMapped = result.Contents?.map((file) => {
           return { Key: file.Key };
        });
        successResponse({ res, data: resultMapped });
        
    });

     app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as {path: string []};
        const { download } = req.query as {download?: string};
        const Key = path.join("/") as string;

        const url = await new S3Service().getPresignedUrl({ Key, download: download ? download : undefined });
        successResponse({ res, data: url });
        
    });

    app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as {path: string []};
        const { download } = req.query;
        const Key = path.join("/") as string;

        const result = await new S3Service().getFile(Key);
        const stream = result.Body as NodeJS.ReadableStream;
        
        res.setHeader("Content-Type", result.ContentType!);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        if(download && download === "true"){
            res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`);
        }

        await pipeline(stream, res)
        
    });

    async function test (){

        // const user = new UserModel({
        //     userName: "ahmed ali",
        //     email: `ahmed_${Date.now()}@gmail.com`,
        //     password: "123456",
        //     age: 24,
        //     phone: "01123456789"
        // })
        // await user.save({ vaildateBeforSave: true });
        // await UserModel.insertMany([
        // {
        //     firstName: "ahmed",
        //     lastName: "ali",
        //     email: `ahmed_${Date.now()}@gmail.com`,
        //     password: "123456",
        //     age: 24,
        // },
        // ]);
        // user.age = 26;
        // await user.save();
        // console.log("user creates");
        

        // const user = new UserModel({});
        // await user.updateOne({ $set: {x: 'test' }})

        // console.log("user updated");
        
        // const user = await UserModel.findOne({ 
        //     firstName: "ahmed",
        //     paranoid: true
        // }as any);


        // console.log( {user});
    
    }

    // test();

    checkConnectionDB();
    await RedisService.connect();
    

    app.use("/auth", authRouter);
    app.use("/posts", postRouter);
    app.use("/stories", storyRouter);
    app.use("/notifications", userNotificationsRouter);
    app.use("/admin/notifications", adminNotificationsRouter);
    app.use("/admin/dashboard", dashboardRouter);
    app.use("/users", usersRouter);

    app.use("{*demo}", (req: Request, res: Response, next: NextFunction) => {
        throw new AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });

    app.use(globalErrorHandler);
    
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    
    
}

export default bootstrap;