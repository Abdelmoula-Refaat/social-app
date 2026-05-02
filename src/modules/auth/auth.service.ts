import { NextFunction, Request, Response } from "express";
import { IUser } from "../../DB/models/user.modal";
import { SignupDto, ConfirmEmailDto, SigninDto, ForgetPasswordDto, ResetPasswordDto } from "./auth.dto";
import { HydratedDocument } from "mongoose";
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

class AuthService {
  private readonly _userRepo = new UserRepository();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;

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
    const { email, password }: SigninDto = req.body;
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

    successResponse({
      res,
      message: "User signed in successfully",
      data: { access_Token, refresh_Token },
    });
  };
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    successResponse({
      res,
      message: "User profile retrieved successfully",
      data: { user: req.user },
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


 
}

export default new AuthService();
