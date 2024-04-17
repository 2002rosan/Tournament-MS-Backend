import { apiError } from "../utils/apiError.js";
import { Game } from "../models/game.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const createGame = asyncHandler(async (req, res) => {
  const { gameName, description, genres } = req.body;

  const coverImage = req.files?.coverImage[0].path;
  if (!coverImage) throw new apiError(400, "Game image is required");

  // Upload coverImage on cloudinary
  const uploadCoverImageOnCloudinary = await uploadOnCloudinary(coverImage);
  if (!uploadCoverImageOnCloudinary)
    throw new apiError(500, "Failed to upload on cloudinary");

  const owner = req.user?.id;
  const game = await Game.create({
    gameName,
    description,
    coverImage: uploadCoverImageOnCloudinary.url,
    owner,
    genres,
  });

  return res.status(200).json(new apiResponse(200, game, "Game created"));
});

const getGames = asyncHandler(async (req, res, next) => {
  try {
    const games = await Game.find();

    return res.status(200).json(new apiResponse(200, games, ""));
  } catch (error) {
    next(error);
  }
});

export { createGame, getGames };
