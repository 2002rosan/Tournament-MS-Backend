import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { User } from "../models/user.model.js";
import fs from "fs";

// To get/fetch all videos and its data from DB
const getAllVideo = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 1, query, sortBy, sortType, userId } = req.query;
  try {
    const data = await Video.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("ownerId", "userName avatar");

    return res.status(200).json(new apiResponse(200, data, "Video Fetched"));
  } catch (error) {
    return next(error);
  }
});

// To publish a video
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // const videoFile = req.files?.videoFile[0]?.path;
  // if (!videoFile) throw new apiError(400, "No file uploaded");
  // console.log(videoFile);

  const thumbnail = req.files?.thumbnail?.[0]?.path;
  if (!thumbnail) throw new apiError(400, "Thumbnail not provided");

  // Upload Video to cloudinary
  // const uploadVideoOnCloudinary = await uploadOnCloudinary(videoFile);
  // if (!uploadVideoOnCloudinary)
  //   throw new apiError(500, "Failed to upload the video on Cloudinary");

  // const videoDuration = uploadVideoOnCloudinary.duration;
  // const totalDurationInMinutes = Math.floor(videoDuration / 60);
  // const totalRemainingSeconds = Math.round(videoDuration % 60);
  // const durationString = `${totalDurationInMinutes}:${
  //   totalRemainingSeconds < 10 ? "0" : ""
  // }${totalRemainingSeconds}`;
  // const [minutes, seconds] = durationString.split(":");
  // const duration = parseInt(minutes) * 60 + parseInt(seconds);

  // Upload thumbnail
  const uploadThumbnailURL = await uploadOnCloudinary(thumbnail);
  if (!uploadThumbnailURL)
    throw new apiError(500, "Failed to upload Thumbnail");

  const ownerId = req.user?._id;

  const video = await Video.create({
    videoFile:
      "http://res.cloudinary.com/dx0lvc2ty/video/upload/v1707997121/w5mtkqzadfjvv2vnzcbi.mp4",
    thumbnail: uploadThumbnailURL.url,
    ownerId,
    title,
    description,
    duration: 10,
  });
  const videoFileData = await Video.findOne(video._id).select("-isPublished");

  if (!videoFileData)
    throw new apiError(500, "Internal Error Occurred while creating a video");

  //   Remove temp file
  // fs.unlinkSync(videoFile);
  // fs.unlinkSync(thumbnail);

  return res
    .status(200)
    .json(new apiResponse(200, videoFileData, "Video uploaded successfully"));
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new apiError(404, "No video found to be deleted");

  const video = await Video.findByIdAndDelete({ _id: videoId });
  if (!video)
    throw new apiError(
      500,
      "The video you are trying to delete does not exist."
    );

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully"));
});

// Video details
const getVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new apiError(404, "No video found");

  const video = await Video.findById({ _id: videoId });

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video Details fetched successfully"));
});

// Update video
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) throw new apiError(404, "Invalid video ID");
  if (!title || !description)
    throw new apiError(404, "Title or description is required");

  // const newThumbnail = req.file?.path;
  // if (!newThumbnail) throw new apiError(404, "No image found to update");

  // const UploadNewThumbnail = await uploadOnCloudinary(newThumbnail);
  const video = await Video.findByIdAndUpdate(videoId, {
    $set: {
      // thumbnail: UploadNewThumbnail?.url,
      title,
      description,
    },
  });
  // await removeFileFromCloudinary(video?.thumbnail);
  // fs.unlinkSync(newThumbnail);

  return res.status(200).json(new apiResponse(200, { video }, "Video updated"));
});

// To make video private or public
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new apiError(404, "Please provide a valid video id");

  try {
    const video = await Video.findById(videoId);
    video.isPublished = !video.isPublished;
    await video.save();

    return res
      .status(200)
      .json(new apiResponse(200, {}, "Video published status changed"));
  } catch (error) {
    throw new apiError(500, "Error while changing video status");
  }
});

export {
  getAllVideo,
  publishVideo,
  deleteVideo,
  getVideoDetails,
  updateVideo,
  togglePublishStatus,
};
