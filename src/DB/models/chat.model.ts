import mongoose, { Types } from "mongoose";

export interface IMessage {
  createdBy: Types.ObjectId;
  content: string;
}

export interface IChat {
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];
  group: string;
  groupImage:string;
  roomId:string;
}


const messageSchema = new mongoose.Schema<IMessage>(
  {
    content: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const chatSchema = new mongoose.Schema<IChat>(
  {
    
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema],
    group: String,
    groupImage: String,
    roomId: String,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatModel = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default ChatModel;

