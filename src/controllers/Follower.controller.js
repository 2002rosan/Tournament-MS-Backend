import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Follower } from "../models/follower.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const toggleFollow = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) throw new apiError(400, "Invalid channelId");

  const isFollowed = await Follower.findOne({
    follower: req.user?.id,
    channel: channelId,
  });

  if (isFollowed) {
    await Follower.findByIdAndDelete(isFollowed?._id);

    return res
      .status(200)
      .json(new apiResponse(200, { isFollowed: false }, "Unfollowed"));
  }

  await Follower.create({
    follower: req.user?.id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new apiResponse(200, { isFollowed: true }, "Followed"));
});

// Follower list of a users
const getUserFollowers = asyncHandler(async (req, res) => {
  let { channelId } = req.params;

  if (!isValidObjectId(channelId)) throw new apiError(400, "Invalid user ID");

  const followers = await Follower.find({ channel: channelId }).populate([
    { path: "follower", select: "fullName userName role avatar emailVerified" },
  ]);

  return res.status(200).json(new apiResponse(200, followers, "Followers"));
});

const getUserFollowing = asyncHandler(async (req, res) => {
  const { followerId } = req.params;

  const followingUsers = await Follower.find({ follower: followerId }).populate(
    { path: "channel", select: "fullName userName role avatar emailVerified" }
  );

  return res
    .status(200)
    .json(new apiResponse(200, followingUsers, "Following"));
});

export { toggleFollow, getUserFollowers, getUserFollowing };
