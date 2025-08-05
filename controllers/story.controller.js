import { Story } from "../models/story.schema.js";
import cloudinary from "cloudinary";
import multer from "multer";
import { User } from "../models/User.js";

// ✅ Configure Cloudinary from .env
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// ✅ Multer in-memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// ✅ Helper function to upload to Cloudinary
const handleUpload = async (file) => {
  try {
    return await cloudinary.v2.uploader.upload(file, {
      resource_type: "auto", // handles both image & video
    });
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw error;
  }
};

// 📌 Upload Story API
export const uploadStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image or video uploaded." });
    }

    // Convert buffer to Base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const uploaded = await handleUpload(dataURI);

    // Save story in DB
    const story = await Story.create({
      user: req.user.userId,
      image: uploaded.secure_url,
      isActive: true,
      viewers: [],
    });

    res.status(201).json(story);
  } catch (err) {
    console.error("❌ Story upload failed:", err.message);
    res.status(500).json({
      message: "Story upload failed",
      error: err.message,
    });
  }
};

// 📌 Get All Stories API
export const getAllStories = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's followers
    const mainUser = await User.findById(userId).select("followers");
    const friendIds = mainUser.followers.map((id) => id.toString());
    friendIds.push(userId.toString());

    // Fetch stories from friends & user
    const stories = await Story.find({
      user: { $in: friendIds },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name profilePicture");

    res.status(200).json(stories);
  } catch (error) {
    console.error("❌ Error fetching stories:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Mark Story as Watched API
export const markStoryWatched = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.userId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (!story.viewers.includes(userId)) {
      story.viewers.push(userId);
      await story.save();
    }

    res.json(story);
  } catch (error) {
    console.error("❌ Error marking story watched:", error.message);
    res.status(500).json({ message: error.message });
  }
};
