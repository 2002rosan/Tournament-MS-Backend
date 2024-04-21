import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

// To get/fetch all videos and its data from DB
const getAllVideo = asyncHandler(async (req, res, next) => {
  const { sortBy, title } = req.query;
  let page = parseInt(req.query?.page) || 1;
  let limit = parseInt(req.query?.limit) || 5;

  if (isNaN(page) || isNaN(limit)) {
    throw new apiError(400, "Invalid page or limit");
  }

  let sortOption = {};
  if (sortBy === "asc") {
    sortOption._id = 1;
  } else {
    sortOption._id = -1;
  }

  let queryOption = {};
  if (title) {
    queryOption.$text = { $search: title };
  }
  // Add filter for isPublished
  queryOption.isPublished = true;

  try {
    const data = await Video.find(queryOption)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([{ path: "ownerId", select: "userName avatar" }]);

    return res.status(200).json(new apiResponse(200, data, "Video Fetched"));
  } catch (error) {
    return next(error);
  }
});

// To publish a video
const publishVideo = asyncHandler(async (req, res, next) => {
  const { title, description, gameId } = req.body;

  try {
    let video;
    const ownerId = req.user?.id;
    const videoFile = req.files?.videoFile[0]?.path;
    if (!videoFile) throw new apiError(400, "No file uploaded");

    const thumbnail = req.files?.thumbnail?.[0]?.path;
    if (!thumbnail) throw new apiError(400, "Thumbnail not provided");

    // Upload Video to cloudinary
    const uploadVideoOnCloudinary = await uploadOnCloudinary(videoFile);
    if (!uploadVideoOnCloudinary)
      throw new apiError(500, "Failed to upload the video on Cloudinary");

    const videoDuration = uploadVideoOnCloudinary.duration;
    const totalDurationInMinutes = Math.floor(videoDuration / 60);
    const totalRemainingSeconds = Math.round(videoDuration % 60);
    const durationString = `${totalDurationInMinutes}:${
      totalRemainingSeconds < 10 ? "0" : ""
    }${totalRemainingSeconds}`;
    const [minutes, seconds] = durationString.split(":");
    const duration = parseInt(minutes) * 60 + parseInt(seconds);

    // Upload thumbnail
    const uploadThumbnailURL = await uploadOnCloudinary(thumbnail);
    if (!uploadThumbnailURL)
      throw new apiError(500, "Failed to upload Thumbnail");

    video = await Video.create({
      videoFile: uploadVideoOnCloudinary.url,
      thumbnail: uploadThumbnailURL.url,
      ownerId,
      title,
      description,
      duration,
      game: gameId,
    });

    return res
      .status(200)
      .json(new apiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    next(error);
  }
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

  removeFileFromCloudinary(video?.videoFile);

  return res
    .status(200)
    .json(new apiResponse(200, videoId, "Video deleted successfully"));
});

// Video by video id
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new apiError(404, "No video found");

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "Likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "ownerId",
        foreignField: "_id",
        as: "Owner",
      },
    },
    {
      $lookup: {
        from: "games",
        localField: "game",
        foreignField: "_id",
        as: "Game",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$Likes" },
        owner: { $first: "$Owner" },
        game: { $first: "$Game" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$Likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        likesCount: 1,
        isLiked: 1,
        "owner.emailVerified": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
        "owner.role": 1,
        "owner.userName": 1,
        "game.gameName": 1,
        "game.genres": 1,
        "game.coverImage": 1,
      },
    },
  ]);

  if (!video || video.length === 0) throw new apiError(404, "No video found");

  // Increment the video count by 1
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
  return res
    .status(200)
    .json(new apiResponse(200, video[0], "Video Details fetched successfully"));
});

// Update video
const updateVideo = asyncHandler(async (req, res, next) => {
  try {
    const { videoId, title, description } = req.body;

    if (!videoId) throw new apiError(404, "Invalid video ID");
    if (!title || !description)
      throw new apiError(404, "Title or description is required");

    // const newThumbnail = req.file?.path;
    // if (!newThumbnail) throw new apiError(404, "No image found to update");

    // const UploadNewThumbnail = await uploadOnCloudinary(newThumbnail);
    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
        },
      },
      { new: true }
    );
    // await removeFileFromCloudinary(video?.thumbnail);
    // fs.unlinkSync(newThumbnail);

    return res
      .status(200)
      .json(new apiResponse(200, { video }, "Video updated"));
  } catch (error) {
    next(error);
  }
});

// To make video private or public
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new apiError(404, "Please provide a valid video id");

  try {
    const video = await Video.findById(videoId);
    video.isPublished = !video.isPublished;
    await video.save();
    const status = await Video.findById(videoId);

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { videoId: videoId, status: status.isPublished },
          "Video published status changed"
        )
      );
  } catch (error) {
    throw new apiError(500, "Error while changing video status");
  }
});

const getUsersVideo = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) throw new apiError(401, "User id is required");

    const video = await Video.find({ ownerId: userId });

    return res
      .status(200)
      .json(new apiResponse(200, video, "Video fetched success"));
  } catch (error) {
    next(error);
  }
};

const getMyVideos = async (req, res, next) => {
  try {
    const userId = req.params;
    const videos = await Video.find({ ownerId: userId.userId }).exec();

    // Populate likes and comments for each video
    const videosWithLikesAndComments = await Promise.all(
      videos.map(async (video) => {
        const populatedVideo = video.toJSON(); // Convert Mongoose document to plain object
        // Populate likes
        populatedVideo.likes = await Like.find({ video: video._id })
          .populate("likedBy")
          .exec();
        // Populate comments
        populatedVideo.comments = await Comment.find({ video: video._id })
          .populate("owner")
          .exec();
        return populatedVideo;
      })
    );
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          videosWithLikesAndComments,
          "Video fetched success"
        )
      );
  } catch (error) {
    next(error);
  }
};

const getGamesVideo = async (req, res, next) => {
  try {
    const gameId = req.params.gameId;

    const videos = await Video.find({ game: gameId }).populate([
      { path: "ownerId", select: "userName avatar" },
    ]);

    return res
      .status(200)
      .json(new apiResponse(200, videos, "Video fetched success"));
  } catch (error) {
    next(error);
  }
};

export {
  getAllVideo,
  publishVideo,
  deleteVideo,
  getVideoById,
  updateVideo,
  togglePublishStatus,
  getUsersVideo,
  getMyVideos,
  getGamesVideo,
};
