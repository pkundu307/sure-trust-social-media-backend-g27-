import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import cloudinary from "cloudinary";
import multer from "multer";

// --- Cloudinary Configuration ---
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// --- Cloudinary Upload Helper ---
async function handleUpload(file) {
  const res = await cloudinary.v2.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

// --- Multer Configuration ---
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// --- Add a New Post ---
export const addPost = async (req, res) => {
  try {
    const { text } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Not authorized, user not found." });
    }

    if (!text) {
      return res.status(400).json({ message: "Post text is required." });
    }

    let imageUrl = null;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      console.log("Base64 Image String:", b64);
      console.log("buffer:", req.file.buffer);
      
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const cldRes = await handleUpload(dataURI);
      imageUrl = cldRes.secure_url;
    }

    const newPost = await Post.create({
      user: req.user.userId,
      text,
      image: imageUrl,
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "Server error while creating post.",
      error: error.message,
    });
  }
};

// --- Get My All Posts ---
export const getMyAllPosts = async (req, res) => {
  try {
    const user = req.user.userId;
    const posts = await Post.find({ user, deleteAt: null })
      .sort({ createdAt: -1 })
      .populate("user");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
  }
};

// --- Get All Friend Posts ---
export const getAllPosts = async (req, res) => {
  try {
    const user = req.user.userId;
    const mainUser = await User.findById(user).select("followers");
    const friendIds = mainUser.followers.map((id) => id.toString());
    friendIds.push(user.toString());

    const posts = await Post.find({ user: { $in: friendIds }, deletedAt: null })
      .sort({ createdAt: -1 })
      .populate("user", "name profilePicture")
      .populate("comments.user", "name profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
  }
};

// --- Like / Unlike Post + Emit Socket Event ---
export const likePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let isLiked = false;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    await post.save();

    const updatedPost = await Post.findById(postId).populate("user", "name profilePicture");
    // ✅ Emit socket event
    req.io.emit("post_liked", {
      postId: updatedPost._id.toString(),
      likes: updatedPost.likes,
    });

    res.status(200).json({ post: updatedPost, liked: isLiked });
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Add Comment to Post ---
export const addComment = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;
  const { text } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: "Failed to comment" });
  }
};

// --- Soft Delete Post ---
export const softDeletePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== userId)
      return res.status(403).json({ message: "Not authorized to delete" });

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.status(200).json({ message: "Post soft-deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Permanently Delete Post ---
export const deletePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== userId)
      return res.status(403).json({ message: "Not authorized to delete" });

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post permanently deleted" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Restore Post ---
export const restorePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== userId)
      return res.status(403).json({ message: "Not authorized to restore" });

    post.isDeleted = false;
    post.deletedAt = null;
    await post.save();

    res.status(200).json({ message: "Post restored successfully" });
  } catch (error) {
    console.error("Error restoring post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Get My Deleted Posts ---
export const getMyDeletedPosts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const deletedPosts = await Post.find({ user: userId, isDeleted: true })
      .sort({ deletedAt: -1 })
      .populate("user", "name profilePicture");

    res.status(200).json(deletedPosts);
  } catch (error) {
    console.error("Error fetching deleted posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
