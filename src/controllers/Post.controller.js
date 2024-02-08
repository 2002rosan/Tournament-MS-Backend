import { Post } from "../models/post.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

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
