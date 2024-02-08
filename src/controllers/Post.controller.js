import { Post } from "../models/post.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// To create post / tweet
const createPost = asyncHandler(async (req, res) => {
  const { postData } = req.body;
  const userId = req.user?._id;
  if (!postData) throw new apiError(404, "Missing Data");

  const createPost = await Post.create({
    owner: userId,
    content: postData,
  });
  const data = await createPost.save();
  if (!data) throw new apiError(500, "Server Error");

  return res.status(200).json(new apiResponse(200, data, "Post tweeted"));
});

// Get all posts of a specific user
const getUserPosts = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const data = await Post.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userPosts",
      },
    },
    {
      $project: {
        _id: 0,
        content: 1,
        "userPosts.userName": 1,
      },
    },
  ]);
  if (!data) throw new apiError(500, "Error fetching posts");

  return res
    .status(200)
    .json(new apiResponse(200, data, "Posts fetched successfully"));
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
