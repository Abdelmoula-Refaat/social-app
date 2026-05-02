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
import UserModel from "./DB/models/user.modal";

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

    async function test (){
        // const user = new UserModel({
        //     userName: "ahmed ali",
        //     email: `ahmed_${Date.now()}@gmail.com`,
        //     password: "123456",
        //     age: 24,
        //     phone: "01123456789"
        // })
        // await user.save({ vaildateBeforSave: true });
        // user.age = 26;
        // await user.save();
        // console.log("user creates");

        const user = new UserModel({});
        await user.updateOne({ $set: {x: 'test' }})

        console.log("user updated");
        
    
    }

    // test();

    checkConnectionDB();
    await RedisService.connect();
    

    app.use("/auth", authRouter);

    app.use("{*demo}", (req: Request, res: Response, next: NextFunction) => {
        throw new AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });

    app.use(globalErrorHandler);
    
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    
    
}

export default bootstrap;