import mongoose, { Types } from "mongoose";

export interface IStory {
  createdBy: Types.ObjectId;
  attachments: string[];
  expiresAt: Date;
}

const storySchema = new mongoose.Schema<IStory>(
  {
    createdBy: { type: Types.ObjectId, ref: "User", required: true, index: true },
    attachments: { type: [String], default: [], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const StoryModel =
  mongoose.models.Story || mongoose.model<IStory>("Story", storySchema);

export default StoryModel;
