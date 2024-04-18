import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tournamentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    banner: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
    },
    schedule: {
      registration: {
        start: Date,
        end: Date,
      },
      matches: {
        start: Date,
        end: Date,
      },
    },
    result: {
      first: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      second: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      third: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    playerLimit: Number,
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teamBased: {
      type: Boolean,
      default: false, // Indicates whether the tournament is team-based or not
    },
    teams: [
      {
        name: String,
        owner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        members: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

tournamentSchema.plugin(mongooseAggregatePaginate);
export const Tournament = mongoose.model("Tournament", tournamentSchema);
