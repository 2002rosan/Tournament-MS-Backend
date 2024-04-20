import mongoose from "mongoose";

const tournamentResultSchema = new mongoose.Schema(
  {
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

export const TournamentResult = mongoose.model(
  "TournamentResult",
  tournamentResultSchema
);
