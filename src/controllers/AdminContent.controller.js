import { AdminContent } from "../models/adminContent.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const BackGroundContent = async (req, res, next) => {
  try {
    const videoFile = req.files?.videoFile[0]?.path;
    const backgroundImage = req.files?.backgroundImage[0]?.path;

    if (videoFile) {
      const uploadVideo = await uploadOnCloudinary(videoFile);
      if (!uploadVideo) throw new apiError(422, "Failed to Upload Video");

      const backGroundVideo = await AdminContent.create({
        videoFile: uploadVideo.url,
        owner,
      });

      return res
        .status(200)
        .json(
          new apiResponse(200, backGroundVideo, "Video created successfully")
        );
    }

    if (backgroundImage) {
      const uploadImage = await uploadOnCloudinary(uploadImage);
      if (!uploadImage) throw new apiError(422, "Failed to Upload Video");

      const backgroundImage = await AdminContent.create({
        backgroundImage: uploadImage.url,
        owner,
      });

      return res
        .status(200)
        .json(
          new apiResponse(200, backgroundImage, "Video created successfully")
        );
    }
  } catch (error) {
    next(error);
  }
};

export { BackGroundContent };
