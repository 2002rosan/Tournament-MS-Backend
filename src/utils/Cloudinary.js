import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
  api_key: process.env.CLOUNDINARY_API_KEY,
  api_secret: process.env.CLOUNDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // check if the file exists
    if (!localFilePath) return null;
    // uploads the file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath); // removes the file saved locally in the system as the upload operation succeeds
    return res;
  } catch (error) {
    fs.unlinkSync(localFilePath); // removes the file saved locally in the system as the upload operation fails
    return null;
  }
};

const removeFileFromCloudinary = async (cloudinaryPath) => {
  if (!cloudinaryPath) return null;
  const public_idWithExtension = cloudinaryPath.substring(
    cloudinaryPath.lastIndexOf("/") + 1
  );
  const public_id = public_idWithExtension.split(".").slice(0, -1).join(".");
  await cloudinary.uploader.destroy(public_id);
  return 1;
};

export { uploadOnCloudinary, removeFileFromCloudinary };
