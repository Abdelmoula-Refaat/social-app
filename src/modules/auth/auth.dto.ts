import * as z from "zod";
import {
  confirmEmailSchema,
  signupSchema,
  signinSchema,
  reSendOtpSchema,
  forgetPasswordSchema,
  resetPasswordSchema
} from "./auth.vaildation";

export type SignupDto = z.infer<typeof signupSchema.body>;
export type SigninDto = z.infer<typeof signinSchema.body>;
export type ConfirmEmailDto = z.infer<typeof confirmEmailSchema.body>;
export type reSendOtpDto = z.infer<typeof reSendOtpSchema.body>;
export type ForgetPasswordDto = z.infer<typeof forgetPasswordSchema.body>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema.body>;
