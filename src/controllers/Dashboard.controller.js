import mongoose from "mongoose";
import { Follower } from "../models/follower.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const getProfileStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  // count followers
  const [countFollower] = await Follower.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $count: "Total_followers",
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

  // Total video views
  const totalVideoViews = await Video.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        _id: 0,
        ownerId: 0,
      },
    },
  ]);

  // Total likes per video
  const totalLikes = await Video.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "videoId",
        as: "likedVideos",
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        totalLikes: {
          $size: "$likedVideos",
        },
      },
    },
  ]);

  if (totalLikes.length === 0) throw new apiError(404, "No likes in the video");
  if (totalVideos.length === 0) throw new apiError(404, "No videos found");
  if (totalVideoViews.length === 0)
    throw new apiError(404, "No videos found to get views");

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        [countFollower, totalVideos, totalLikes, totalVideoViews],
        "Profile stats fetched successfully"
      )
    );
});

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
