import mongoose from "mongoose";
import { Follower } from "../models/follower.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkFollowedOrNot = asyncHandler(async (req, _, next) => {
  let userId = req.user._id;
  userId = userId.toString();
  const { channelId } = req.params;

  const [followerCount] = await Follower.aggregate([
    {
      $match: {
        follower: new mongoose.Types.ObjectId(userId),
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "Total Followers",
    },
  ]);
  if (!followerCount) {
    req.followerCount = 0;
  } else {
    req.followerCount = 1;
  }
  next();
});
