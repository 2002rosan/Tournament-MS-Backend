import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import { Tournament } from "./tournament.model.js";
import { Comment } from "./comment.model.js";
import { Video } from "./video.model.js";
import { Post } from "./post.model.js";
import { Like } from "./like.model.js";
import { Follower } from "./follower.model.js";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    role: {
      type: "string",
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 2);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function () {
    const doc = await this.model.findOne(this.getFilter());
    await Tournament.deleteMany({ owner: doc._id });
    await Comment.deleteMany({ owner: doc._id });
    await Video.deleteMany({ ownerId: doc._id });
    await Post.deleteMany({ owner: doc._id });
    await Like.deleteMany({ likedBy: doc._id });
    await Follower.deleteMany({ follower: doc._id });
  }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY + "ms",
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFERESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFERESH_TOKEN_EXPIRY + "ms",
    }
  );
};

export const User = mongoose.model("User", userSchema);
