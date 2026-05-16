// import * as z from "zod";
// import { GeneralRules } from "../../common/utils/generalRules";

// export const createCommentSchema = {
//   body: z.strictObject({
//     content: z.string().min(1).max(5000),
//   }),
// };

// export const updateCommentSchema = {
//   body: z.strictObject({
//     content: z.string().min(1).max(5000),
//   }),
//   params: z.strictObject({
//     postId: GeneralRules.id,
//     commentId: GeneralRules.id,
//   }),
// };

// export const commentReactionSchema = {
//   body: z.strictObject({
//     emoji: z.string().min(1).max(32),
//   }),
//   params: z.strictObject({
//     postId: GeneralRules.id,
//     commentId: GeneralRules.id,
//   }),
// };

import * as z from "zod";
import { GeneralRules } from "../../common/utils/generalRules";
import { On_Model_Enum } from "../../common/enum/post.enum";

export const createCommentSchema = {
  body: z.strictObject({
    content: z.string().optional(),
    attachments: z.array(GeneralRules.file).optional(),
    tags: z.array(GeneralRules.id).optional(),
    onModel: z.enum(On_Model_Enum),
  }).superRefine((args, ctx)=> {

      if(!args.content && !args.attachments?.length){
        ctx.addIssue({
            code: "custom",
            path: ["content"],
            message: "Content is required",
          
        })
      }

      if(args?.tags){
        const uniqueTags = new Set(args.tags);
        if(args.tags.length !== uniqueTags.size ){
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated tags",
            });
        }
      }
  }),
  params: z.strictObject({
    postId: GeneralRules.id,
    commentId: GeneralRules.id.optional(),
  }),
};


