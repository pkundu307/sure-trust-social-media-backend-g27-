import { Story } from "../models/story.schema.js";
import cloudinary from "cloudinary";
import multer from "multer";
import { User } from "../models/User.js";
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const storage = multer.memoryStorage();
export const upload = multer({ storage });

const handleUpload = async (file) => {
  return await cloudinary.v2.uploader.upload(file, {
    resource_type: "auto",
  });
};

export const uploadStory = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image file uploaded." });

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploaded = await handleUpload(dataURI);

    const story = await Story.create({
      user: req.user.userId,
      image: uploaded.secure_url,
    });

    res.status(201).json(story);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Story upload failed", error: err.message });
  }
};

export const getAllStories = async (req, res) => {
  try {
        const user = req.user.userId;

    const mainUser = await User.findById(req.user.userId).select('followers')
    console.log(mainUser);
    
    const friendIds = mainUser.followers.map(id=> id.toString());
    friendIds.push(user.toString());

   
const posts = await Story.find({ user:{$in:friendIds}, isActive: true })
      .sort({ createdAt: -1 })
      .populate("user",'name profilePicture')

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
  }
};
