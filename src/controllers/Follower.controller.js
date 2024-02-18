import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Follower } from "../models/follower.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const toggleFollow = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) throw new apiError(400, "Invalid channelId");

  const isFollowed = await Follower.findOne({
    follower: req.user?._id,
    channel: channelId,
  });

  if (isFollowed) {
    await Follower.findByIdAndDelete(isFollowed?._id);

    return res
      .status(200)
      .json(new apiResponse(200, { isFollowed: false }, "Unfollowed"));
  }

  await Follower.create({
    follower: req.user?._id,
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

  channelId = new mongoose.Types.ObjectId(channelId);

  const followers = await Follower.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "follower",
        pipeline: [
          {
            $lookup: {
              from: "followers",
              localField: "_id",
              foreignField: "channel",
              as: "followedToFollower",
            },
          },
          {
            $addFields: {
              followedToFollower: {
                $cond: {
                  if: {
                    $in: [channelId, "$followedToFollower.follower"],
                  },
                  then: true,
                  else: false,
                },
              },
              followersCount: {
                $size: "$followedToFollower",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$follower",
    },
    {
      $project: {
        _id: 0,
        follower: {
          _id: 1,
          userName: 1,
          fullName: 1,
          avatar: 1,
          followedToFollower: 1,
          followersCount: 1,
        },
      },
    },
  ]);

  return res.status(200).json(new apiResponse(200, followers, "Followers"));
});

const getUserFollowing = asyncHandler(async (req, res) => {
  const { followerId } = req.params;

  const followingUsers = await Follower.aggregate([
    {
      $match: {
        follower: new mongoose.Types.ObjectId(followerId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "followedChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "ownerId",
              as: "videos",
            },
          },
          {
            $addFields: {
              latestVideo: {
                $last: "$videos",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$followedChannel",
    },
    {
      $project: {
        _id: 0,
        followedChannel: {
          _id: 1,
          userName: 1,
          fullName: 1,
          avatar: 1,
          latestVideo: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            ownerId: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, followingUsers, "Following"));
});

export { toggleFollow, getUserFollowers, getUserFollowing };
