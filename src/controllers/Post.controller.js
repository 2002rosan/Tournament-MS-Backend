import { Post } from "../models/post.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

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
