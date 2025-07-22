import mongoose from "mongoose";
import { type } from "os";

const storySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String, required: true },
    viewers:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
    isActive:{type:Boolean,default:true},
    createdAt: { type: Date, default: Date.now ,index:{expires:'24h'}}
}, { timestamps: true });

export const Story = mongoose.model('Story', storySchema);