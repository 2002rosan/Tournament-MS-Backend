import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
    imageFile: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
