import mongoose from "mongoose";
import { Follower } from "../models/follower.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// To get profile stats
const getProfileStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  // count followers
  const totalFollowers = await Follower.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        followerCount: {
          $sum: 1,
        },
      },
    },
  ]);

  // Total videos
  const [totalVideos] = await Video.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $count: "Total_videos",
    },
  ]);

  // Total likes per video
  const videoLikes = await Video.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $project: {
        totalLikes: {
          $size: "$likes",
        },
        totalViews: "$views",
        totalVideos: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$totalLikes",
        },
        totalViews: {
          $sum: "$totalViews",
        },
        totalVideos: {
          $sum: 1,
        },
      },
    },
  ]);

  const channelStats = {
    totalFollowers: totalFollowers[0]?.followerCount || 0,
    totalVideos: totalVideos.Total_videos || 0,
    totalLikes: videoLikes[0]?.totalLikes || 0,
    totalViews: videoLikes[0]?.totalViews || 0,
  };

  if (!channelStats) throw new apiError(404, "No stats found");

  return res
    .status(200)
    .json(
      new apiResponse(200, channelStats, "Profile stats fetched successfully")
    );
});

// To get channel videos
const getChannelVideo = asyncHandler(async (req, res) => {
  const user = req.user?._id;

  const videoList = await Video.aggregate([
    {
      $match: {
        ownerId: user,
      },
    },
  ]);
  if (!videoList) throw new apiError(404, "No videos found");

  return res
    .status(200)
    .json(new apiResponse(200, videoList, "Video list fetched successfully"));
});

export { getProfileStats, getChannelVideo };
