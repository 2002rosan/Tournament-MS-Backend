import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: String,
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
    rank: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    playerId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const Team = mongoose.model("Team", teamSchema);
