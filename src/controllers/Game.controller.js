import { apiError } from "../utils/apiError.js";
import { Game } from "../models/game.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const createGame = asyncHandler(async (req, res) => {
  const { gameName, description } = req.body;

  const coverImage = req.files?.coverImage?.[0].path;
  if (!coverImage) throw new apiError(400, "Game image is required");

  //   Upload coverImage on cloudinary
  const uploadCoverImageOnCloudinary = await uploadOnCloudinary(coverImage);
  if (!uploadCoverImageOnCloudinary)
    throw new apiError(500, "Failed to upload on cloudinary");

  const owner = req.user?._id;
  const game = await Game.create({
    gameName,
    description,
    coverImage: uploadCoverImageOnCloudinary.url,
    owner,
  });

  const gameData = await Game.findOne(game._id);
  if (!gameData) throw new apiError(500, "Server error");

  return res.status(200).json(new apiResponse(200, gameData, "Game created"));
});

export { createGame };
