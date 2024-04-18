import { Game } from "../models/game.model.js";
import { Team } from "../models/team.model.js";
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
  const { title, description, game, schedule, playerLimit, teamBased } =
    req.body;

  // Check if gameId is valid
  const gameExists = await Game.exists({ _id: game });
  if (!gameExists) throw new apiError(400, "Invalid Game Id");

  const banner = req.files?.banner?.[0]?.path;
  if (!banner) throw new apiError(400, "Tournament image is required");

  if (!schedule) throw new apiError(400, "Schedule is required");
  if (!playerLimit) throw new apiError(400, "Player limit is required");

  if (
    schedule.registration.start >= schedule.registration.end ||
    schedule.matches.start >= schedule.matches.end
  ) {
    throw new apiError(
      400,
      "Invalid schedule: Registration or match dates are not in proper order"
    );
  }

  // Check if a tournament with the same title already exists
  const existingTournament = await Tournament.findOne({ title });
  if (existingTournament) {
    throw new apiError(400, "Tournament with this title already exists");
  }

  // Upload image in cloudinary
  const uploadGameBannerOnCloudinary = await uploadOnCloudinary(banner);
  if (!uploadGameBannerOnCloudinary)
    throw new apiError(500, "Failed to upload game banner on Cloudinary");

  const owner = req.user?.id;
  const tournament = await Tournament.create({
    banner: uploadGameBannerOnCloudinary.url,
    owner,
    title,
    description,
    game,
    schedule,
    playerLimit,
    teamBased, // Include teamBased flag in the tournament document
  });

  return res
    .status(200)
    .json(new apiResponse(200, tournament, "Tournament created successfully"));
});

const joinTournament = async (req, res, next) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new apiError(404, "Tournament does not exist");

    const registrationEndDate = new Date(tournament.schedule.registration.end);
    const presentDate = new Date();
    if (presentDate > registrationEndDate) {
      throw new apiError(400, "Registration closed");
    }

    if (tournament.teamBased) {
      // If the tournament is team-based, find the team of the owner
      const team = await Team.findOne({ owner: req.user.id });
      if (!team) {
        throw new apiError(404, "You don't own any team");
      }

      // Check if the team is already joined in the tournament
      if (tournament.teams.some((team) => team.owner.equals(req.user.id))) {
        throw new apiError(
          400,
          "Your team is already joined in this tournament"
        );
      }

      // Add the team to the tournament
      tournament.teams.push({
        name: team.name,
        owner: req.user.id,
        members: team.members,
      });
    } else {
      // If the tournament is not team-based, check if the user is already joined as an individual player
      if (tournament.players.includes(req.user.id)) {
        throw new apiError(400, "You are already joined in this tournament");
      }

      // Add the player to the tournament
      tournament.players.push(req.user.id);
    }

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

const tournamentResult = asyncHandler(async (req, res) => {
  const { user } = req.body;
  const owner = req.user?.id;
  const { tournamentId } = req.params;
  if (!tournamentId) throw new apiError(404, "Invalid tournament Id");

  const tournament = await Tournament.findOne({ _id: tournamentId, owner });
  console.log(tournament);

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
  tournamentResult,
};
