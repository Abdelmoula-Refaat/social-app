import { Model } from "mongoose";
import PostModel, { IPost } from "../models/post.modal";
import BaseRepository from "./base.repository";


class PostRepository extends BaseRepository<IPost> {

  constructor(protected readonly model: Model<IPost> = PostModel) {
    super(model);
  }
}

export default PostRepository;