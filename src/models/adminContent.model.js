import mongoose, { Schema } from "mongoose";

const adminContentSchema = new Schema(
  {
    videoFile: {
      type: String,
    },
    status: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const AdminContent = mongoose.model("AdminContent", adminContentSchema);
