import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { Like } from "../models/like.model.js";

// To create post / tweet
const createPost = asyncHandler(async (req, res, next) => {
  const { title } = req.body;
  console.log(title);
  try {
    const image = req.files?.image[0]?.path;
    console.log({ image: image });
    const userId = req.user?.id;
    if (!title) throw new apiError(404, "Missing Data");

    let ImageFile = "";
    if (image) {
      const uploadImage = await uploadOnCloudinary(image);
      if (!uploadImage) throw new apiError(500, "Failed to Upload Image");
      ImageFile = uploadImage.url;
    }

    const createPost = await Post.create({
      owner: userId,
      content: title,
      imageFile: ImageFile,
    });
    const data = await createPost.save();
    if (!data) throw new apiError(500, "Server Error");

    return res.status(200).json(new apiResponse(200, data, "Post tweeted"));
  } catch (error) {
    next(error);
  }
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
        from: "likes",
        localField: "_id",
        foreignField: "post",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "post",
        as: "comments",
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        imageFile: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" },
        likedBy: "$likes.likedBy",
      },
    },
    {
      $unwind: {
        path: "$likedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        content: { $first: "$content" },
        imageFile: { $first: "$imageFile" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        owner: { $first: "$owner" },
        likesCount: { $first: "$likesCount" },
        commentsCount: { $first: "$commentsCount" },
        likedBy: { $push: "$likedBy" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedUsers",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        imageFile: 1,
        createdAt: 1,
        updatedAt: 1,
        ownerDetails: {
          userName: 1,
          fullName: 1,
          emailVerified: 1,
          avatar: 1,
        },
        likesCount: 1,
        commentsCount: 1,
        likedBy: "$likedUsers._id",
      },
    },
    {
      $sort: {
        likesCount: -1, // Sort by highest likes
        createdAt: -1, // Then sort by newest
      },
    },
  ]);

  if (!posts) throw new apiError(500, "Error fetching posts");

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts fetched successfully"));
});

const getPostByID = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  try {
    if (!postId) throw new apiError(400, "No post ID provided");

    const findPost = await Post.findById(postId);
    if (!findPost) throw new apiError(404, "Post not found");

    const postData = await findPost.populate([
      { path: "owner", select: "userName avatar fullName emailVerified" },
    ]);

    const postLike = await Like.find({ post: postId }).populate([
      { path: "likedBy", select: "_id" },
    ]);

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { postData, postLike, totalLikes: postLike.length },
          "Post fetched"
        )
      );
  } catch (error) {
    next(error);
  }
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

export {
  createPost,
  getUserPosts,
  getAllPosts,
  updatePost,
  deletePost,
  getPostByID,
};
