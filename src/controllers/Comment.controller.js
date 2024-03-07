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
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "userName",
      },
    },
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$comment", "$$commentId"],
              },
            },
          },
        ],
        as: "commentLikes",
      },
    },
    {
      $addFields: {
        userName: {
          $first: "$userName",
        },
        likeCount: {
          $size: "$commentLikes",
        },
      },
    },
    {
      $project: {
        content: 1,
        "userName.userName": 1,
        "userName.avatar": 1,
        "userName.createdAt": 1,
        likeCount: 1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: 10,
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, comments, "Comments fetched"));
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
    owner: req.user?.id,
  });
  if (!comment) throw new apiError(400, "Comment not created");

  return res.status(200).json(new apiResponse(200, comment, "Comment created"));
});

export { getVideoComments, addComment };
