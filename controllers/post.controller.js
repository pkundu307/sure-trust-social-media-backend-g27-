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

    const posts = await Post.find({ user })
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

    const posts = await Post.find({ user:{$in:friendIds} })
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
  