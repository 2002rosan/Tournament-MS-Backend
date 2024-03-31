import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// To create post / tweet
const createPost = asyncHandler(async (req, res) => {
  const { postData } = req.body;
  const userId = req.user?.id;
  if (!postData) throw new apiError(404, "Missing Data");

  const createPost = await Post.create({
    owner: userId,
    content: postData,
  });
  const data = await createPost.save();
  if (!data) throw new apiError(500, "Server Error");

  return res.status(200).json(new apiResponse(200, data, "Post tweeted"));
});

// Get posts by userId of a specific user
const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) throw new apiError(400, "Invalid userId");

  const posts = await Post.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "Owner",

        pipeline: [
          {
            $project: {
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "post",
        as: "likedPosts",

        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likedPosts",
        },
        ownerDetails: {
          $arrayElemAt: ["$Owner", 0],
        },
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likeCount: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!posts) throw new apiError(500, "Error fetching posts");

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts fetched successfully"));
});

// Get all posts
const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.aggregate([
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "Owner",

        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              emailVerified: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "post",
        as: "likedPosts",

        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
          {
            $count: "isLiked",
          },
        ],
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likedPosts",
        },
        ownerDetails: {
          $arrayElemAt: ["$Owner", 0],
        },
        isLiked: {
          $cond: [{ $eq: [{ $size: "$likedPosts" }, 0] }, false, true],
        },
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likeCount: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!posts) throw new apiError(500, "Error fetching posts");

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts fetched successfully"));
});

// Update post or tweet
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!postId) throw new apiError(404, "Post not found");

  const { postContent } = req.body;
  if (!postContent) throw new apiError(404, "Provide new post data");

  const updatePost = await Post.findByIdAndUpdate(
    postId,
    {
      $set: {
        content: postContent,
      },
    },
    { new: true }
  );
  if (!updatePost) throw new apiError(500, "Error while updating post");

  return res
    .status(200)
    .json(new apiResponse(200, updatePost, "Post updated Successfully!"));
});

// Delete Post
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!postId) throw new apiError(404, "No valid ID provided");

  const postStatus = await Post.findByIdAndDelete(postId);
  if (!postStatus) throw new apiError(500, "Error while deleting your post");

  return res.status(200).json(new apiResponse(200, {}, "Post deleted"));
});

export { createPost, getUserPosts, getAllPosts, updatePost, deletePost };
