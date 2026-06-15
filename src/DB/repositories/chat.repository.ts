import { Model } from "mongoose";
import ChatModel, { IChat } from "../models/chat.model";
import BaseRepository from "./base.repository";


class ChatRepository extends BaseRepository<IChat> {

  constructor(protected readonly model: Model<IChat> = ChatModel) {
    super(model);
  }
}

export default ChatRepository;