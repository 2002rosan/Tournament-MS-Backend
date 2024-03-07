import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";

// To get/fetch all videos and its data from DB
const getAllVideo = asyncHandler(async (req, res, next) => {
  const { sortBy, title } = req.query;
  let page = parseInt(req.query?.page) || 1;
  let limit = parseInt(req.query?.limit) || 5;
  console.log(title);

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

  // 1h 2h 3h

  const getVideo = queryOption ? Video.find(queryOption) : Video.find();
  try {
    const data = await getVideo
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
  const { title, description } = req.body;

  try {
    let video;
    const ownerId = req.user?.id;
    const videoFile = req.files?.videoFile[0]?.path;
    if (!videoFile) throw new apiError(400, "No file uploaded");
    console.log(videoFile);

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

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully"));
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
        pipeline: [
          {
            $lookup: {
              from: "followers",
              localField: "_id",
              foreignField: "channel",
              as: "followers",
            },
          },
          {
            $addFields: {
              followersCount: {
                $size: "$followers",
              },
              isFollowed: {
                $cond: {
                  if: {
                    $in: [req.user?.id, "$followers.follower"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              userName: 1,
              avatar: 1,
              followersCount: 1,
              isFollowed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$Likes",
        },
        owner: {
          $first: "$Owner",
        },
        isLikes: {
          $cond: {
            if: {
              $in: [req.user?.id, "$Likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        owner: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) throw new apiError(404, "No video found");

  // Increment the video count by 1
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
  return res
    .status(200)
    .json(new apiResponse(200, video[0], "Video Details fetched successfully"));
});

// Update video
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) throw new apiError(404, "Invalid video ID");
  if (!title || !description)
    throw new apiError(404, "Title or description is required");

  const newThumbnail = req.file?.path;
  if (!newThumbnail) throw new apiError(404, "No image found to update");

  const UploadNewThumbnail = await uploadOnCloudinary(newThumbnail);
  const video = await Video.findByIdAndUpdate(videoId, {
    $set: {
      thumbnail: UploadNewThumbnail?.url,
      title,
      description,
    },
  });
  await removeFileFromCloudinary(video?.thumbnail);
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
  getVideoById,
  updateVideo,
  togglePublishStatus,
};
