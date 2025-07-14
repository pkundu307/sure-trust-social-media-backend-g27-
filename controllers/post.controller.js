import { Post } from "../models/Post.js";
import {User}from "../models/User.js";
export const addPost = async (req, res) => {
  const { text, image } = req.body;
  try {
    const post = await Post.create({
      user: req.user.userId,
      text,
      image,
    });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
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

  export const softDeletePost = async (req,res)=>{
    const postId = req.params.id;
    const userId = req.user.userId;
    try {
      //1. Find the post by ID
      const post =await Post.findById(postId);
      if(!post) return res.status(404).json({message:"Post not found"});
      //2. Check if the post belongs to the user
      if(post.user.toString() !== userId) {
        return res.status(403).json({ message: "You are not authorized to delete this post" });
      }
      
      //4.Soft delete: set deletedAt
      const updated = await Post.findByIdAndUpdate(
        postId,
        { deletedAt: new Date() }, // mark as deleted
        { new: true }
      );

    if (!updated) {
      return res.status(404).json({ message: 'Post not found' });
    }


      res.status(200).json({ message: "Post soft-deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  export const deletePost = async (req,res)=>{
    const postId = req.params.id;
    const userId = req.user.userId;
    try {
      //1. Find the post by ID
      const post =await Post.findById(postId);
      if(!post) return res.status(404).json({message:"Post not found"});
      //2. Check if the post belongs to the user
      if(post.user.toString() !== userId) {
        return res.status(403).json({ message: "You are not authorized to delete this post" });
      }
      //3. Delete the post completely from both UI and database
      await Post.findByIdAndDelete(postId);
      res.status(200).json({ message: "Post deleted successfully" });
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

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to restore this post" });
    }

    post.deletedAt = null;  // Reset the deletedAt flag
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

    const deletedPosts = await Post.find({ user: userId, deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .populate("user", "name profilePicture");

    res.status(200).json(deletedPosts);
  } catch (error) {
    console.error("Error fetching deleted posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
