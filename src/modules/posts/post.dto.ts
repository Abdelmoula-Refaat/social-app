import * as z from "zod";
import { createPostSchema, updatePostSchema } from "./post.vaildation";

export type CreatePostDto = z.infer<typeof createPostSchema.body>;
export type updatePostDto = z.infer<typeof updatePostSchema.body>;
