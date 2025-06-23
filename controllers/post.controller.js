import { Post } from "../models/Post.js";

export const addPost = async (req,res)=>{
    const {text,image}=req.body;
    try {
        const post = await Post.create({
            user:req.user.userId,
            text,
            image
        })
        res.status(201).json(post)
    } catch (error) {
        console.error(error)
    }
}

export const getAllPosts =async(req,res)=>{
    try {
       const user=req.user.userId
       console.log(user,'0-0-0-');
       
        const posts=await Post.find({user})
        .sort({createdAt:-1})
        .populate('user')

        res.status(200).json(posts)
    } catch (error) {
        console.error(error)
    }
}