"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return this.model.create(data);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async findOne({ filter, projection, }) {
        return this.model.findOne(filter, projection);
    }
    async find({ filter, projection, options, }) {
        return this.model
            .find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    findByIdAndUpdate({ id, update, options, }) {
        return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    findOneAndUpdate({ filter, update, options, }) {
        return this.model.findOneAndUpdate(filter, update, {
            new: true,
            ...options,
        });
    }
    findOneAndDelete({ filter, options, }) {
        return this.model.findOneAndDelete(filter, options);
    }
}
exports.default = BaseRepository;
