import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

const uploadOnCloudinary = async (localFile) => {
  try {
    // check if the file exists
    if (!localFile) return null;
    // uploads the file on cloudinary
    const res = await cloudinary.uploader.upload(localFile, {
      resource_type: "auto",
    });
    return res;
  } catch (error) {
    fs.unlinkSync(localFile); // removes the file saved locally in the system as the upload operation fails
    return null;
  }
};

cloudinary.uploader.upload(
  "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" },
  function (error, result) {
    console.log(result);
  }
);

export { uploadOnCloudinary };
