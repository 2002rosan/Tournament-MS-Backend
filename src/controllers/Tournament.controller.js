import { Game } from "../models/game.model.js";
import { Tournament } from "../models/tournament.model.js";
import {
  uploadOnCloudinary,
  removeFileFromCloudinary,
} from "../utils/Cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// To create or organize tournament
const createTournament = asyncHandler(async (req, res) => {
  const { title, description, game, schedule, playerLimit } = req.body;

  // Check if gameId is valid
  const gameExists = await Game.exists({ _id: game });
  if (!gameExists) throw new apiError(400, "Invalid Game Id");

  // const banner = req.files?.banner?.[0]?.path;
  // if (!banner) throw new apiError(400, "Tournament image is required");

  if (!schedule) throw new apiError(400, "Schedule is required");
  if (!playerLimit) throw new apiError(400, "Player limit is required");

  //   Upload image in cloudinary
  // const uploadGameBannerOnCloudinary = await uploadOnCloudinary(banner);
  // if (!uploadGameBannerOnCloudinary)
  //   throw new apiError(500, "Failed to upload game banner on Cloudinary");

  const owner = req.user?.id;
  const tournament = await Tournament.create({
    // banner: uploadGameBannerOnCloudinary.url,
    banner: "1223",
    owner,
    title,
    description,
    game,
    schedule,
    playerLimit,
  });

  return res
    .status(200)
    .json(new apiResponse(200, tournament, "Tournament created successfully"));
});

const joinTournament = async (req, res, next) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new apiError(401, "Tournament does not exists");

    const registrationEndDate = new Date(tournament.schedule.registration.end);
    const presentDate = new Date();
    if (presentDate > registrationEndDate)
      throw new apiError(400, "Registration closed");

    tournament.players.push(req.user?.id);
    await tournament.save();

    return res.status(200).json({ message: "Tournament joined successfully" });
  } catch (error) {
    next(error);
  }
};

// To get all tournaments
const getAllTournment = asyncHandler(async (req, res) => {
  const tournaments = Tournament.find();

  const data = await tournaments.populate([
    { path: "game", select: "gameName followers coverImage" },
    { path: "players", select: "userName avatar" },
  ]);

  if (data.length < 1)
    return res
      .status(200)
      .json(new apiResponse(200, [], "No Tournaments Available"));

  return res
    .status(200)
    .json(new apiResponse(200, data, "Tournaments fetched successfully"));
});

// To update tournament
const updateTournament = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const { title, description } = req.body;

  if (!tournamentId) throw new apiError(404, "Invalid tournament ID");
  if (!title || !description)
    throw new apiError(404, "Title or description is required");

  const newBanner = req.file?.path;
  if (!newBanner)
    throw new apiError(404, "Please provide new tournament image or banner");

  const UploadNewBanner = await uploadOnCloudinary(newBanner);

  const tournament = await Tournament.findByIdAndUpdate(tournamentId, {
    $set: {
      banner: UploadNewBanner?.url,
      title,
      description,
    },
  });
  // Delets old banner
  await removeFileFromCloudinary(tournament?.banner);

  return res.status(200).json(new apiResponse(200, {}, "Tournament updated"));
});

// Delete tournament
const deleteTournament = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  if (!tournamentId) throw new apiError(404, "Invalid tournament Id");

  const tournament = await Tournament.findByIdAndDelete({ _id: tournamentId });
  if (!tournament)
    throw new apiError(
      500,
      "The tournament you are trying to delete doesnot exists"
    );

  return res.status(200).json(new apiResponse(200, {}, "Tournament deleted"));
});

export {
  createTournament,
  getAllTournment,
  updateTournament,
  deleteTournament,
  joinTournament,
};
