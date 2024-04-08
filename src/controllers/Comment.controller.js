import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Post } from "../models/post.model.js";

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

const addPostComment = asyncHandler(async (req, res, next) => {
  try {
    const { postId, content } = req.body;
    if (!(postId && content))
      throw new apiError(400, "Post ID and content are required");

    const post = await Post.findById(postId);
    if (!post) throw new apiError(404, "Post not found");

    const commentPost = await Comment.create({
      content,
      post: postId,
      owner: req.user?.id,
    });
    if (!commentPost) throw new apiError(400, "Comment not created");

    await commentPost.populate([
      { path: "owner", select: "avatar userName emailVerified fullName" },
    ]);

    return res
      .status(200)
      .json(new apiResponse(200, commentPost, "Comment created"));
  } catch (error) {
    next(error);
  }
});

const getPostComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  try {
    if (!postId) throw new apiError(400, "No postID provided");

    const commentsWithLikes = await Comment.aggregate([
      {
        $match: { post: new mongoose.Types.ObjectId(postId) },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "likes.likedBy",
          foreignField: "_id",
          as: "likedBy",
        },
      },
      {
        $addFields: {
          likedBy: "$likedBy._id",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          video: 1,
          owner: { userName: 1, fullName: 1, emailVerified: 1, avatar: 1 },
          post: 1,
          createdAt: 1,
          likedBy: 1,
        },
      },
    ]);

    return res.status(200).json(
      new apiResponse(
        200,
        {
          comments: commentsWithLikes,
          totalComments: commentsWithLikes.length,
        },
        "Comments with likes fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
});

const deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  try {
    if (!commentId) throw new apiError(400, "Comment Id is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new apiError(401, "Comment not found");

    const deleteComment = await Comment.findByIdAndDelete(commentId);
    if (!deleteComment) throw new apiError(401, "Deleting comment failed");

    return res
      .status(200)
      .json(new apiResponse(200, comment, "Successfully deleted the comment"));
  } catch (error) {
    next(error);
  }
});

export {
  getVideoComments,
  addComment,
  addPostComment,
  getPostComment,
  deleteComment,
};
