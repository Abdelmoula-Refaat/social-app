import { NextFunction, Request, Response } from "express";
import { IUser } from "../../DB/models/user.modal";
import { SignupDto, ConfirmEmailDto, SigninDto, ForgetPasswordDto, ResetPasswordDto } from "./auth.dto";
import { HydratedDocument, Types } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { encrypt } from "../../common/utils/security/encrypt.security";
import { Compare, Hash } from "../../common/utils/security/hash";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplate } from "../../common/utils/email/email.template";
import { AppError } from "../../common/utils/global-error-handler";
import { eventEmitter } from "../../common/utils/email/email.events";
import { EmailEnum } from "../../common/enum/email.enum";
import { successResponse } from "../../common/utils/security/response.success";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import RedisService from "../../common/service/redis.service";
import TokenService from "../../common/service/token.service";
import { randomUUID } from "crypto";
import {
  ACCESS_SECRET_KEY_Admin,
  ACCESS_SECRET_KEY_USER,
  REFRESH_SECRET_KEY_Admin,
  REFRESH_SECRET_KEY_USER,
  CLIENT_ID
} from "../../config/config.service";
import redisService from "../../common/service/redis.service";
import { reSendOtpDto } from "./auth.dto";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import tokenService from "../../common/service/token.service";
import { S3Service } from "../../common/service/s3.service";
import notificationService from "../../common/service/notification.service";
import ChatRepository from "../../DB/repositories/chat.repository";

class AuthService {
  private readonly _userRepo = new UserRepository();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;
  private readonly _s3Service = new S3Service();
  private readonly _notificationService = notificationService;
  private readonly _chatRepo = new ChatRepository();

  constructor() {}

  sendEmailOtp =  async ({ email, subject }: { email: string; subject: EmailEnum }) => {
    const isBlocked = await redisService.ttl(redisService.blocked_otp_key(email));
    if(isBlocked && isBlocked > 0) {
      throw new AppError(`You are blocked from requesting OTP. Please try again after ${isBlocked} seconds`, 429);
    }
    
    const ttlOtp = await redisService.ttl(redisService.otp_key({ email, subject }));
    if(ttlOtp && ttlOtp > 0) {
      throw new AppError(`OTP already sent. Please try again after ${ttlOtp} seconds`, 429);
    }

    if (await redisService.getValue(redisService.max_otp_key(email)) >= "3") {
      await redisService.set_value({
        key: redisService.blocked_otp_key(email),
        value: "1",
        ttl: 15 * 30,
      });
      throw new AppError("You have exceeded the maximum number of OTP requests", 429);
    }

    const otp = await generateOtp();

    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "hello from social media app",
        html: emailTemplate(otp),
      });
      await redisService.set_value({
        key: redisService.otp_key({
          email,
          subject,
        }),
        value: Hash({ plain_text: `${otp}`}),
        ttl: 60 * 2,
      });
      await  redisService.incr(redisService.max_otp_key(email));
    });
  };

  signup = async (req: Request, res: Response, next: NextFunction) => {
    let {
      firstName,
      lastName,
      email,
      password,
      cPassword,
      age,
      gender,
      address,
      phone,
    }: SignupDto = req.body;

    if (await this._userRepo.findOne({ filter: { email } })) {
      throw new AppError("Email already exists", 409);
    }

    const user: HydratedDocument<IUser> = await this._userRepo.create({
      firstName,
      lastName,
      email,
      password: Hash({ plain_text: password }),
      age,
      gender,
      address,
      phone: phone ? encrypt(phone) : null,
    } as Partial<IUser>);

    const otp = await generateOtp();

    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Confirm your email",
        html: emailTemplate(otp),
      });
      await this._redisService.set_value({
        key: this._redisService.otp_key({
          email,
          subject: EmailEnum.confirmEmail,
        }),
        value: Hash({ plain_text: `${otp}` }),
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

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, code }: ConfirmEmailDto = req.body;

    const otpvalue = await this._redisService.getValue(
      this._redisService.otp_key({ email }),
    );
    if (!otpvalue) {
      throw new AppError("OTP expired", 400);
    }
    if (!Compare({ plain_text: code, cipher_text: otpvalue })) {
      throw new AppError("Invalid OTP", 400);
    }

    const user = await this._userRepo.findOneAndUpdate({
      filter: {
        email,
        confrimed: { $exists: false },
        provider: ProviderEnum.local,
      },
      update: { confrimed: true },
    });

    if (!user) {
      throw new AppError("User not found or already confirmed", 404);
    }

    await this._redisService.deletekey(this._redisService.otp_key({ email }));

    successResponse({
      res,
      message: "Email confirmed successfully",
      data: user,
    });
  };

  signin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, fcm }: SigninDto = req.body;
    const user = await this._userRepo.findOne({
      filter: {
        email,
        provider: ProviderEnum.local,
        confrimed: { $exists: true },
      },
    });

    if (!user) {
      throw new AppError("User not exist or invalid provider", 400);
    }

    if (!Compare({ plain_text: password, cipher_text: user.password })) {
      throw new AppError("Invalid password", 400);
    }

    const uuid = randomUUID();

    const access_Token = this._tokenService.GenerateToken({
      payload: {
        id: user._id,
        email: user.email,
      },
      secret_key:
        user?.role == RoleEnum.user
          ? ACCESS_SECRET_KEY_USER!
          : ACCESS_SECRET_KEY_Admin!,
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
      secret_key:
        user?.role == RoleEnum.user
          ? REFRESH_SECRET_KEY_USER!
          : REFRESH_SECRET_KEY_Admin!,
      options: {
        expiresIn: "1y",
        jwtid: uuid,
      },
    });

    if (fcm) {
     await this._redisService.addFCM({ userId: user._id, FCMToken: fcm })
     const tokens = await this._redisService.getFCMs(user._id)

     await this._notificationService.sendNotifications({
      tokens,
      data: {
        title: `hi ${user.firstName}`,
        body: `new login at ${new Date()}`,
      },
     })
     
    }

    successResponse({
      res,
      message: "User signed in successfully",
      data: { access_Token, refresh_Token },
    });
  };
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this._userRepo.findOne({
      filter: { _id: req.user?._id as Types.ObjectId },
      populate: [
        {
          path: "friends"
        },
      ],
    });
    const groups = await this._chatRepo.find({
      filter: {
        participants: {
          $in: [req?.user?._id ],
        },
        group: { $exists: true }
      
      },
    });
    successResponse({
      res,
      message: "success signin",
      data: { user, groups },
    });
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: reSendOtpDto = req.body;

    const user = await this._userRepo.findOne({ filter: { email, confrimed: { $exists: false }, provider: ProviderEnum.local } });
    if (!user) {
      throw new AppError("User not exist or already confirmed", 400);
    }
    await this.sendEmailOtp({ email, subject: EmailEnum.confirmEmail });
    successResponse({
      res,
      message: "OTP resent successfully",
    });
  }

  
    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { email }: ForgetPasswordDto = req.body
        const user = await this._userRepo.findOne({
            filter: { email, isConfirmed: { $exists: true }, provider: ProviderEnum.local }
        })
        if (!user) {
            throw new Error("user not exist or already confirmed")
        }
        await this.sendEmailOtp({ email, subject: EmailEnum.forgetPassword })
        successResponse({ res })
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { email, code, password }: ResetPasswordDto = req.body
        const otpValue = await redisService.getValue(redisService.otp_key({ email, subject: EmailEnum.forgetPassword }))
        if (!otpValue) {
            throw new Error("otp expire")
        }
        if (!Compare({ plain_text: code, cipher_text: otpValue })) {
            throw new Error("invalid otp")
        }

        const user = await this._userRepo.findOneAndUpdate({
            filter: { email, confirmed: { $exists: true }, provider: ProviderEnum.local },
            update: {
                password: Hash({ plain_text: password }),
                changeCredential: new Date()
            }
        })

        if (!user) { 
            throw new Error("user not exist or already confirmed") 
        }

        await redisService.deletekey(redisService.otp_key({ email, subject: EmailEnum.forgetPassword }))
        successResponse({ res })
    }

    signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
        const { idToken } = req.body

        const client = new OAuth2Client();

        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID!
        });

        const payload = ticket.getPayload();
      
        const { email, email_verified, name } = payload as TokenPayload

        let user = await this._userRepo.findOne({ filter: { email: email! } })

        if (!user) {
            // register
            user = await this._userRepo.create({
                email: email!,
                confrimed: email_verified!,
                userName: name!,
                provider: ProviderEnum.google
            })
        }

        if(user.provider == ProviderEnum.local){
            throw new AppError("login please on system");
        }

        // login
        const access_token = tokenService.GenerateToken({
            payload: {
                id: user._id,
                email: user.email
            },
            secret_key: user.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER! : ACCESS_SECRET_KEY_Admin!,
            options: {
                expiresIn: "1day",
            }
        })
    }

    updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        const { firstName, lastName, phone, address, gender } = req.body;
        const update: Record<string, unknown> = {};
        if (firstName !== undefined) update.firstName = firstName;
        if (lastName !== undefined) update.lastName = lastName;
        if (address !== undefined) update.address = address;
        if (gender !== undefined) update.gender = gender;
        if (phone !== undefined) update.phone = encrypt(phone);

        const user = await this._userRepo.findOneAndUpdate({
            filter: { _id: req.user!._id },
            update: { $set: update },
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        successResponse({ res, data: user });
    };

    deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
        const permanent = req.query.permanent === "true";
        const id = req.user!._id;
        if (permanent) {
            await this._userRepo.findOneAndDelete({ filter: { _id: id } });
        } else {
            await this._userRepo.findOneAndUpdate({
                filter: { _id: id },
                update: { $set: { deletedAt: new Date() } },
            });
        }
        successResponse({ res, data: { deleted: true, permanent } });
    };

    uploadImage = async (req: Request, res: Response, next: NextFunction) => {

        // const key = await this._s3Service.uploadFile({
        //     file: req.file!,
        //     path: "General",

        // }); 
        
        // const key = await this._s3Service.uploadLargeFile({
        //     file: req.file!,
        //     path: "users/large",

        // }); 
        
        // const urls = await this._s3Service.uploadFiles({
        //     files: req.files as Express.Multer.File[],
        //     path: "users/many",

        // });  

        const { contentType, fileName } = req.body;
        
        const { url, Key} = await this._s3Service.createPresignedUrl({
            fileName,
            contentType,
            path: `users/${req.user?._id}`,
            
        });
        
        await this._userRepo.findOneAndUpdate({
            filter: { _id: req?.user?._id },
            update: { profilePic: Key },
        })

        successResponse({ res, data: { Key, url} });
    }

    // =============== graphql =============

    getUsers = async () => {
        return await this._userRepo.find({ filter: {} });
    }

    getUser = async (id: any) => {
        return await this._userRepo.findOne({ filter: { _id: id } });
    }
 
}

export default new AuthService();
