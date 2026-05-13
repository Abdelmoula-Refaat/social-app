import { Model } from "mongoose";
import CommentModel, { IComment } from "../models/comment.modal";
import BaseRepository from "./base.repository";

class CommentRepository extends BaseRepository<IComment> {
  constructor(protected readonly model: Model<IComment> = CommentModel) {
    super(model);
  }
}

export default CommentRepository;
