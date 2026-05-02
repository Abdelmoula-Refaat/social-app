import mongoose, { HydratedDocument, Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import { Hash } from "../../common/utils/security/hash";
import { AppError } from "../../common/utils/global-error-handler";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { EmailEnum } from "../../common/enum/email.enum";
import { emailTemplate } from "../../common/utils/email/email.template";
import { eventEmitter } from "../../common/utils/email/email.events";

export interface IUser {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  age: number;
  phone?: string;
  address?: string;
  gender?: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;
  confrimed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 25,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 25,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (): boolean {
        return this.provider == ProviderEnum.local ? true : false
      },
      trim: true,
      min: 3,
      max: 25,
    },
    age: {
      type: Number,
      required: function (): boolean {
        return this.provider == ProviderEnum.local ? true : false
      },
      trim: true,
      min: 20,
      max: 60,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: GenderEnum,
      default: GenderEnum.male,
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.user,
    },
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.local,
    },

    confrimed: Boolean,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (val: string) {
    this.set({ firstName: val.split(" ")[0], lastName: val.split(" ")[1] });
  });

// userSchema.pre("validate", function () {
//   console.log("--pre validate hook--");
//   console.log(this);
//   if(this.age < 18){
//     throw new AppError ("age is too small")
//   }
// });

// userSchema.post("validate", function () {
//   console.log("--post validate hook--");
//   console.log(this);
// });

// userSchema.pre("save", function (this: HydratedDocument<IUser> & { is_new: boolean}) {
//   console.log("--pre hook1--");
//   console.log(this.isNew);
//   this.is_new = this.isNew;

//   if(this.isModified("password")){
//     this.password = Hash({ plain_text: this.password });
//   }
  
// })

// userSchema.post("save", async function () {
//   console.log("--post hook2--");
//   const that = this as HydratedDocument<IUser> & { is_new: boolean };
//   console.log(that.is_new);

//   if (that.is_new) {
//     const otp = await generateOtp();
//     eventEmitter.emit(EmailEnum.confirmEmail, async () => {
//       await sendEmail({
//         to: this.email,
//         subject: "Confirm your email",
//         html: emailTemplate(otp),
//       });
//     });
//   }
// });

userSchema.pre("updateOne", {document: true, query: false }, function () {
  console.log("--pre updateOne hook--");
  console.log(this);
  
});

const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default UserModel;
