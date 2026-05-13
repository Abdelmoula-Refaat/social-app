import { Model } from "mongoose";
import StoryModel, { IStory } from "../models/story.modal";
import BaseRepository from "./base.repository";

class StoryRepository extends BaseRepository<IStory> {
  constructor(protected readonly model: Model<IStory> = StoryModel) {
    super(model);
  }
}

export default StoryRepository;
