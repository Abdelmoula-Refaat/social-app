import { ProjectionType, QueryFilter, QueryOptions, UpdateQuery, PopulateOptions} from "mongoose";
import { HydratedDocument, Model, Types } from "mongoose";


abstract class BaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id);
  }

  async findOne({
    filter,
    projection,
  }: {
    filter: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, projection);
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TDocument>[] | []> {
    return this.model
      .find(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .populate(options?.populate as PopulateOptions);
  }

  findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: Types.ObjectId;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
  }

  findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndDelete(filter, options);
  }

  async paginate<T>({
    page,
    limit,
    sort,
    populate,
    search,
  }: {
    page?: number;
    limit?: number;
    sort?: any;
    populate?: any;
    search?: QueryFilter<T>;
    
  }) {
    page = +page! || 1;
    limit = +limit! || 1;

    if(page < 1) page = 1;
    if(limit < 1) limit = 2;

    const skip = (page - 1) * limit;

    const [data, totalDoc] = await Promise.all([
      await this.model.find({ ...(search ?? {})}).limit(limit).skip(skip).sort(sort).populate(populate).exec(),
      await this.model.countDocuments({ ...(search ?? {})})
    ]);

    const totalPages = Math.ceil(totalDoc / limit);
   
    return {
      meta: {
        currentPage: page,
        totalPages,
        limit,
        totalDoc
      },
      data
    }
  }

  insertMany(docs: Partial<TDocument>[]) {
    return this.model.insertMany(docs as never);
  }

  updateMany(filter: QueryFilter<TDocument>, update: UpdateQuery<TDocument>) {
    return this.model.updateMany(filter, update);
  }

  deleteMany(filter: QueryFilter<TDocument>) {
    return this.model.deleteMany(filter);
  }
}

export default BaseRepository;