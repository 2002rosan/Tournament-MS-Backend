import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { apiResponse } from "../utils/apiResponse.js";

// To get comments of a specific video
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 5 } = req.query;

  if (!isValidObjectId(videoId)) throw new apiError(400, "Invalid videoId");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(404, "Video not found");

  const comments = await Comment.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "Owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "comment",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$Owner",
        },
        isLikes: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: {
          userName: 1,
          avatar: 1,
        },
        isLiked: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comment = await Comment.aggregatePaginate(comments, options);

  if (!comment) throw new apiError(404, "Comments not found");

  return res
    .status(200)
    .json(new apiResponse(200, comment, "Comments fetched"));
});

// To add a comment to a specific video
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  if (!content) throw new apiError(400, "Please enter a comment");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(404, "Video not found");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });
  if (!comment) throw new apiError(400, "Comment not created");

  return res.status(200).json(new apiResponse(200, comment, "Comment created"));
});

export { getVideoComments, addComment };
