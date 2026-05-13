import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";

export const reSendOtpSchema = {
  body: z.strictObject({
    email: z.email("Invalid email address"),
  }),
};

export const signinSchema = {
  body: reSendOtpSchema.body.safeExtend({
    password: z.string().min(6),
    fcm: z.string().optional(),
  }),
};

export const signupSchema = {
  body: signinSchema.body
    .safeExtend({
      firstName: z.string({ error: "firstName is required" }).min(3).max(25),
      lastName: z.string({ error: "lastName is required" }).min(3).max(25),
      cPassword: z.string().min(6),
      age: z.number().min(18).max(60),
      gender: z.enum(GenderEnum).optional(),
      address: z.string().min(3).max(25).optional(),
      phone: z.string().min(3).max(25).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.cPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["cPassword"],
          message: "Passwords do not match",
        });
      }
    }),
};

export const confirmEmailSchema = {
  body: z.strictObject({
    email: z.email("Invalid email address"),
    code: z.string().regex(/^\d{6}$/),
  }),
};

export const forgetPasswordSchema = {
  body: z.strictObject({
    email: z.email("Invalid email address"),
  }),
};

export const resetPasswordSchema = {
  body: z
    .strictObject({
      email: z.email("Invalid email address"),
      code: z.string().regex(/^\d{6}$/, "Invalid verification code"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      cPassword: z
        .string()
        .min(6, "Confirm password must be at least 6 characters"),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.cPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["cPassword"],
          message: "Passwords do not match",
        });
      }
    }),
};

export const updateProfileSchema = {
  body: z
    .strictObject({
      firstName: z.string().min(3).max(25).optional(),
      lastName: z.string().min(3).max(25).optional(),
      phone: z.string().min(3).max(25).optional(),
      address: z.string().min(3).max(100).optional(),
      gender: z.enum(GenderEnum).optional(),
    })
    .superRefine((data, ctx) => {
      if (!Object.keys(data).length) {
        ctx.addIssue({
          code: "custom",
          message: "At least one field is required",
          path: ["firstName"],
        });
      }
    }),
};

export const deleteAccountQuery = {
  query: z.object({
    permanent: z.enum(["true", "false"]).optional(),
  }),
};
