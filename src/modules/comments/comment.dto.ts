import * as z from "zod";
import { createCommentSchema } from "./comment.vaildation";

export type CreateCommentDTO = z.infer<typeof createCommentSchema.body>;
