import { timeStamp } from "console";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    bio:String,
    profilePicture:String,
    followers:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
    following:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
},{timeStamp:true})

export const User = mongoose.model('User', userSchema);
