import * as z from "zod";
import { GeneralRules } from "../../common/utils/generalRules";

export const createCommentSchema = {
  body: z.strictObject({
    content: z.string().min(1).max(5000),
  }),
};

export const updateCommentSchema = {
  body: z.strictObject({
    content: z.string().min(1).max(5000),
  }),
  params: z.strictObject({
    postId: GeneralRules.id,
    commentId: GeneralRules.id,
  }),
};

export const commentReactionSchema = {
  body: z.strictObject({
    emoji: z.string().min(1).max(32),
  }),
  params: z.strictObject({
    postId: GeneralRules.id,
    commentId: GeneralRules.id,
  }),
};
