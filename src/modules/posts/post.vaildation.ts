import * as z from "zod";
import { GeneralRules } from "../../common/utils/generalRules";
import { Allow_Comment_Enum, Availability_Enum } from "../../common/enum/post.enum";

export const createPostSchema = {
  body: z.strictObject({
    content: z.string().optional(),
    attachments: z.array(GeneralRules.file).optional(),
    tags: z.array(GeneralRules.id).optional(),
    allow_comment: z.enum(Allow_Comment_Enum).default(Allow_Comment_Enum.allow),
    availability: z.enum(Availability_Enum).default(Availability_Enum.friends),
    
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
};

export const likePostSchema = {
    params: z.strictObject({
        postId: GeneralRules.id,
    })
}

export const postIdParams = likePostSchema.params;

export const deletePostSchema = {
  params: postIdParams,
  query: z.object({
    permanent: z.enum(["true", "false"]).optional(),
  }),
};

export const postReactionSchema = {
  params: postIdParams,
  body: z.strictObject({
    emoji: z.string().min(1).max(32),
  }),
};

export const updatePostSchema = {
  body: z.strictObject({
    content: z.string().optional(),
    attachments: z.array(GeneralRules.file).optional(),
    removeFiles: z.array(z.string()).optional(),
    tags: z.array(GeneralRules.id).optional(),
    allow_comment: z.enum(Allow_Comment_Enum).default(Allow_Comment_Enum.allow),
    availability: z.enum(Availability_Enum).default(Availability_Enum.friends),
    removeTags: z.array(GeneralRules.id).optional(),
    
  }).superRefine((args, ctx)=> {

      if(args.tags?.length){
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
  params: likePostSchema.params
};
