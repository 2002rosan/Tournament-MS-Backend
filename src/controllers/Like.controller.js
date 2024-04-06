import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";

// For video likes
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const checkId = await Video.findById(videoId);
  if (!checkId) throw new apiError(404, "No video found");

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?.id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new apiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?.id,
  });

  return res.status(200).json(new apiResponse(200, { isLiked: true }));
});

// For comment likes
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const checkId = await Comment.findById(commentId);
  if (!checkId) throw new apiError(404, "No comment found");

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?.id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new apiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?.id,
  });

  return res.status(200).json(new apiResponse(200, { isLiked: true }));
});

// For Post Likes
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  const checkId = await Post.findById(postId);
  if (!checkId) throw new apiError(404, "Invalid post ID");

  const likedAlready = await Like.findOne({
    post: postId,
    likedBy: req.user?.id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);
    await Post.findByIdAndUpdate(postId, { isLiked: false });

    return res.status(200).json(new apiResponse(200, { isLiked: false }));
  }

  await Like.create({
    post: postId,
    likedBy: req.user?.id,
  });
  await Post.findByIdAndUpdate(postId, { isLiked: true });

  return res.status(200).json(new apiResponse(200, { isLiked: true }));
});

const getPostLikes = asyncHandler(async (req, res, next) => {
  const { postId } = req.body;

  try {
    if (!postId) throw new apiError(404, "Post ID is required");

    const postLikes = await Like.find({ post: postId }).populate([
      { path: "likedBy", select: "userName fullName avatar emailVerified" },
    ]);
    if (!postLikes) return res.status(404).json("Post not found");

    return res.status(200).json(
      new apiResponse(
        200,
        {
          postlikes: postLikes,
          totalPostLikes: postLikes.length,
        },
        "Likes fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
});

const getCommentLikes = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  try {
    if (!commentId) throw new apiError(401, "Comment ID is required");

    const commentLikes = await Like.find({ comment: commentId });
    if (!commentLikes) return res.status(404).json("Comment not found");

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { commentLikes, totalCommentLikes: commentLikes.length },
          "Likes fetched successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

export {
  toggleVideoLike,
  toggleCommentLike,
  togglePostLike,
  getPostLikes,
  getCommentLikes,
};
