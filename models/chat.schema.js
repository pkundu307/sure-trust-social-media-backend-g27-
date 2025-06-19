import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    groupName: { type: String, trim: true },
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Chat = mongoose.model('Chat', chatSchema);