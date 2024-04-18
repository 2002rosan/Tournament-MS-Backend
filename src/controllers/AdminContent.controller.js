import { AdminContent } from "../models/adminContent.model.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const BackGroundContent = async (req, res, next) => {
  try {
    const { status } = req.body;
    const videoFile = req.files?.videoFile[0]?.path;

    if (!videoFile) throw new apiError(401, "File is required");

    const uploadVideo = await uploadOnCloudinary(videoFile);
    if (!uploadVideo) throw new apiError(422, "Failed to Upload Video");

    const backGroundVideo = await AdminContent.create({
      videoFile: uploadVideo.url,
      owner: req.user?.id,
      status,
    });

    return res
      .status(200)
      .json(
        new apiResponse(200, backGroundVideo, "Video created successfully")
      );
  } catch (error) {
    next(error);
  }
};

const GetBackGroundContent = async (req, res, next) => {
  try {
    const content = await AdminContent.find();

    return res
      .status(200)
      .json(new apiResponse(200, content, "Contents fetched"));
  } catch (error) {
    next(error);
  }
};

const UpdateBackgroundContent = async (req, res, next) => {
  try {
    const { contentId, status } = req.body;
    const videoFile = req.files?.videoFile[0]?.path;
    if (!videoFile) throw new apiError(401, "Video file is required");
    if (!(contentId && status))
      throw new apiError(401, "Please provide all info");

    const uploadVideo = await uploadOnCloudinary(videoFile);

    const updatedContent = await AdminContent.findByIdAndUpdate(contentId, {
      videoFile: uploadVideo.url,
      status,
    });

    if (updatedContent?.videoFile) {
      await removeFileFromCloudinary(updatedContent.videoFile);
    }

    return res
      .status(200)
      .json(new apiResponse(200, updatedContent, "Updated"));
  } catch (error) {
    next(error);
  }
};

export { BackGroundContent, GetBackGroundContent, UpdateBackgroundContent };
