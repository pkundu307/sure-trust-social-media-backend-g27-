// utilities/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const handleUpload = async (file) => {
  return cloudinary.uploader.upload(file, {
    resource_type: "auto",
    folder: "profile_pics", // optional
  });
};
export default cloudinary;