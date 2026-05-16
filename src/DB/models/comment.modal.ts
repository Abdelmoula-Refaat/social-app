// import mongoose, { Types } from "mongoose";
// import { applyParanoidPlugin } from "../plugins/paranoid.plugin";

// export interface ICommentReaction {
//   userId: Types.ObjectId;
//   emoji: string;
// }

// export interface IComment {
//   post: Types.ObjectId;
//   createdBy: Types.ObjectId;
//   content: string;
//   reactions?: ICommentReaction[];
//   deletedAt?: Date;
// }

// const reactionSchema = new mongoose.Schema<ICommentReaction>(
//   {
//     userId: { type: Types.ObjectId, ref: "User", required: true },
//     emoji: { type: String, required: true, trim: true, maxlength: 32 },
//   },
//   { _id: false },
// );

// const commentSchema = new mongoose.Schema<IComment>(
//   {
//     post: { type: Types.ObjectId, ref: "Post", required: true, index: true },
//     createdBy: { type: Types.ObjectId, ref: "User", required: true },
//     content: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
//     reactions: { type: [reactionSchema], default: [] },
//     deletedAt: { type: Date },
//   },
//   { timestamps: true, strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
// );

// applyParanoidPlugin(commentSchema);

// const CommentModel =
//   mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

// export default CommentModel;

import mongoose, { Types } from "mongoose";
import { On_Model_Enum } from "../../common/enum/post.enum";


export interface IComment {
  content?: string;
  folderId: string;
  attachments?: string[];
  likes?: Types.ObjectId[];
  tags?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  refId:Types.ObjectId;
  onModel:On_Model_Enum;
}

const commentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: [String],
    folderId: String,
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    refId: { type: Types.ObjectId, refpath: "onModel", required: true },
    onModel: { type: String, enum: On_Model_Enum, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
  },
);

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
 
});



const commentModel = mongoose.model<IComment>("Comment", commentSchema);

export default commentModel;
