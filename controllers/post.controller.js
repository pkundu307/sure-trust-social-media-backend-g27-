import { Post } from "../models/Post.js";
import { User }from "../models/User.js";
import cloudinary from 'cloudinary';
import multer from 'multer';

// --- Cloudinary Configuration ---
// It's best practice to configure this once when your app starts, 
// but including it here for a self-contained controller file.
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true, // It's a good practice to force https
});

// --- Cloudinary Upload Helper ---
// This helper function uploads a file buffer to Cloudinary
async function handleUpload(file) {
  const res = await cloudinary.v2.uploader.upload(file, {
    resource_type: "auto", // Automatically detect the resource type (image, video, etc.)
  });
  return res;
}

// --- Multer Configuration ---
// We use memoryStorage to temporarily hold the file in memory as a buffer
// before it's uploaded to Cloudinary. This avoids saving it to the server's disk.
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
});

// --- Main Controller: Add a New Post ---
export const addPost = async (req, res) => {
  try {
    // 1. Get text content from the request body
    const { text } = req.body;

    // The 'protect' middleware should have already added the user to the request
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Not authorized, user not found." });
    }

    if (!text) {
        return res.status(400).json({ message: "Post text is required." });
    }

    let imageUrl = null; // Initialize imageUrl as null

    // 2. Check if a file was uploaded
    if (req.file) {
      // Convert the buffer to a base64 data URI
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      // Upload the data URI to Cloudinary
      const cldRes = await handleUpload(dataURI);
      
      // Store the secure URL of the uploaded image
      imageUrl = cldRes.secure_url;
    }

    // 3. Create the new post in the database
    const newPost = await Post.create({
      user: req.user.userId,
      text: text,
      // If imageUrl is not null, it will be added. Otherwise, the field will be omitted.
      image: imageUrl, 
    });

    // 4. Send a successful response
    res.status(201).json(newPost);

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ 
      message: "Server error while creating post.",
      error: error.message 
    });
  }
};
export const getMyAllPosts = async (req, res) => {
  try {
    const user = req.user.userId;
    console.log(user, "0-0-0-");

    const posts = await Post.find({ user, deleteAt: null })
      .sort({ createdAt: -1 })
      .populate("user");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const user = req.user.userId;
    console.log(req.user, "0-0-0-");
    const mainUser = await User.findById(req.user.userId).select('followers')
    const friendIds = mainUser.followers.map(id=> id.toString());
    friendIds.push(user.toString());

    const posts = await Post.find({ user:{$in:friendIds}, deletedAt: null })
      .sort({ createdAt: -1 })
      .populate("user",'name profilePicture')
      .populate("comments.user", "name profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
  }
};

export const likePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let isLiked = false;
    if(post.likes.includes(userId)){
      post.likes=post.likes.filter((id)=>id.toString()!==userId)
    }else{
      post.likes.push(userId)
      isLiked=true;
    }
    await post.save();
      console.log(post);
      
    const updatePost=await Post.findById(postId)

    io.emit('post_liked',{
      postId,likes:updatePost.likes
    })
    res.status(200).json({post:updatePost,liked:isLiked})
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addComment = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;
    const { text } = req.body;
  
    try {
      const post = await Post.findById(postId);
        
      if (!post) return res.status(404).json({ message: 'Post not found' });
  
      const comment = {
        user: userId,
        text,
        createdAt: new Date(),
      };
      console.log(comment, "comment");
      
  
      post.comments.push(comment);
      await post.save();
  
      res.status(201).json({ message: 'Comment added', comments: post.comments });
    } catch (err) {
      res.status(500).json({ message: 'Failed to comment' });
    }
  };

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