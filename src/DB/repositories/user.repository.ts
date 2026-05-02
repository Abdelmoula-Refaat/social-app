import { Model } from "mongoose";
import UserModel, { IUser } from "../models/user.modal";
import BaseRepository from "./base.repository";


class UserRepository extends BaseRepository<IUser> {

  constructor(protected readonly model: Model<IUser> = UserModel) {
    super(model);
  }
}

export default UserRepository;