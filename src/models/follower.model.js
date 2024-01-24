import mongoose, { Schema } from "mongoose";

const followerSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId, // One who is following
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // One to whom 'follower' is following
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Follower = mongoose.model("follower", followerSchema);
