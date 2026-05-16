import mongoose, { Types } from "mongoose";
import { Allow_Comment_Enum, Availability_Enum } from "../../common/enum/post.enum";
import { applyParanoidPlugin } from "../plugins/paranoid.plugin";
import CommentModel from "./comment.modal";

export interface IPostReaction {
  userId: Types.ObjectId;
  emoji: string;
}

export interface IPost {
  _id?: Types.ObjectId;
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  reactions?: IPostReaction[];
  allow_comment?: Allow_Comment_Enum;
  availability?: Availability_Enum;
  folderId: string;
  deletedAt?: Date;
}

const reactionSchema = new mongoose.Schema<IPostReaction>(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, trim: true, maxlength: 32 },
  },
  { _id: false },
);

const postSchema = new mongoose.Schema<IPost>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this: IPost) {
        return !this.attachments?.length;
      },
    },
    attachments: [String],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    tags: [{ type: Types.ObjectId, ref: "User" }],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    reactions: { type: [reactionSchema], default: [] },
    allow_comment: {
      type: String,
      enum: Allow_Comment_Enum,
      default: Allow_Comment_Enum.allow,
    },
    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.public,
    },
    folderId: String,
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    strictQuery: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
});

applyParanoidPlugin(postSchema);

postSchema.post("findOneAndDelete", async function (doc: IPost | null) {
  if (!doc?._id) return;
  await CommentModel.deleteMany({ post: doc._id });
});

postSchema.post("findOneAndUpdate", async function (doc: IPost | null) {
  if (!doc?._id) return;
  const hasSoftDelete = Boolean(doc.deletedAt);
  if (!hasSoftDelete) return;
  await CommentModel.updateMany(
    { post: doc._id, deletedAt: { $exists: false } },
    { $set: { deletedAt: new Date() } },
  );
});

const PostModel =
  mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default PostModel;
