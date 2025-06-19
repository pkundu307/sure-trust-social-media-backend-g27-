import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'comment', 'follow', 'mention', 'friendRequest'], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, //
    isRead : { type: Boolean, default: false },
},{timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);