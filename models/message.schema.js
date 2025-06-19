import mongoose from "mongoose";
import { type } from "os";

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    chat :{type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true},
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);