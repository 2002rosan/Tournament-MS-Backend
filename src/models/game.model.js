import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Tournament } from "./tournament.model.js";

const gameSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // followers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
  },
  { timestamps: true }
);

gameSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function () {
    const doc = await this.model.findOne(this.getFilter());
    await Tournament.updateMany({ game: doc._id }, { $unset: { game: "" } });
  }
);

gameSchema.plugin(mongooseAggregatePaginate);
export const Game = mongoose.model("Game", gameSchema);
