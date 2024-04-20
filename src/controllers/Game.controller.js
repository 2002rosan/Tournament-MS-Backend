import { apiError } from "../utils/apiError.js";
import { Game } from "../models/game.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
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

const getGamesById = asyncHandler(async (req, res, next) => {
  try {
    const gameId = req.params;
    if (!gameId) throw new apiError(401, "Game Id is required");

    const game = await Game.findById({ _id: gameId.id });
    if (!game) throw new apiError(401, "Game not found");

    return res.status(200).json(new apiResponse(200, game, ""));
  } catch (error) {
    next(error);
  }
});

const deleteGames = asyncHandler(async (req, res, next) => {
  try {
    const gameId = req.params;
    if (!gameId) throw new apiError(400, "Game id is required");

    const deleteGame = await Game.findByIdAndDelete({ _id: gameId.id });
    if (!deleteGame) throw new apiError(401, "Game not found");

    removeFileFromCloudinary(deleteGame?.coverImage);

    return res
      .status(200)
      .json(new apiResponse(200, gameId, "Game deleted successfully"));
  } catch (error) {
    next(error);
  }
});

export { createGame, getGames, deleteGames, getGamesById };
