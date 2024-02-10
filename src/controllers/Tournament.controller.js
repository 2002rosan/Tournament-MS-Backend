import { Tournament } from "../models/tournament.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

export { createTournament };
