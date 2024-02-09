import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";

// For video likes
const toggleVideoLike = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId } = req.params;

  const checkId = await Video.findById(videoId);
  if (!checkId) throw new apiError(404, "No video found");

  const checkData = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(checkId),
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);

  if (checkData.length == 0) {
    const toggleLike = await Like.create({
      likedBy: userId,
      video: videoId,
    });
    await toggleLike.save();

    return res.status(200).json(new apiResponse(200, {}, "Video Liked"));
  } else {
    return res
      .status(400)
      .json(new apiResponse(400, {}, "Video Alreday Liked"));
  }
});

// For comment likes
const toggleCommentLike = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { commentId } = req.params;

  const checkId = await Comment.findById(commentId);
  if (!checkId) throw new apiError(404, "No comment found");

  const checkData = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(checkId),
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);
  if (checkData.length == 0) {
    const toggleLike = await Like.create({
      likedBy: userId,
      comment: commentId,
    });
    await toggleLike.save();

    return res.status(200).json(new apiResponse(200, {}, "Comment Liked"));
  } else {
    return res
      .status(400)
      .json(new apiResponse(400, {}, "You already like this comment"));
  }
});

// For Post Likes
const togglePostLike = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { postId } = req.params;

  const checkId = await Post.findById(postId);
  if (!checkId) throw new apiError(404, "Invalid post ID");

  const checkData = await Like.aggregate([
    {
      $match: {
        post: new mongoose.Types.ObjectId(checkId),
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);

  if (checkData.length == 0) {
    const toggleLike = await Like.create({
      likedBy: userId,
      post: postId,
    });
    await toggleLike.save();

    return res.status(200).json(new apiResponse(200, {}, "Post liked"));
  } else {
    return res
      .status(400)
      .json(new apiResponse(400, {}, "Already liked the post"));
  }
});

// For total likes in a video
const totalLikesInVideo = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likedVideoList = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "data",
      },
    },
    {
      $unwind: "$data",
    },
    {
      $project: {
        "data.videoFile": 1,
        "data.thumbNail": 1,
        "data.owner": 1,
        "data.title": 1,
        "data.description": 1,
        "data.duration": 1,
      },
    },
  ]);
  if (!likedVideoList) throw new apiError(500, "Server Error");

  return res
    .status(200)
    .json(new apiResponse(200, likedVideoList, "liked video lists"));
});

export {
  toggleVideoLike,
  toggleCommentLike,
  togglePostLike,
  totalLikesInVideo,
};
