import { Tournament } from "../models/tournament.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";

// To create or organize tournament
const createTournament = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const banner = req.files?.banner?.[0]?.path;
  if (!banner) throw new apiError(400, "Tournament image is required");

  //   Upload image in cloudinary
  const uploadGameBannerOnCloudinary = await uploadOnCloudinary(banner);
  if (!uploadGameBannerOnCloudinary)
    throw new apiError(500, "Failed to upload game banner on Cloudinary");

  const owner = req.user?._id;
  const tournament = await Tournament.create({
    banner: uploadGameBannerOnCloudinary.url,
    owner,
    title,
    description,
  });

  const tournamentData = await Tournament.findOne(tournament._id);
  if (!tournamentData) throw new apiError(500, "Internal server error");

  return res
    .status(200)
    .json(
      new apiResponse(200, tournamentData, "Tournament created successfully")
    );
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
  await removieFileFromCloudinary(tournament?.banner);
  fs.unlinkSync(newBanner);

  return res.status(200).json(new apiResponse(200, {}, "Tournament updated"));
});

export { createTournament };
