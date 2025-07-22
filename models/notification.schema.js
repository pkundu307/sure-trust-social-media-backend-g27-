import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    type: { type: String, enum: ['like_post', 'comment', 'follow', 'mention', 'friend_accept','friend_request'], required: true },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, //
    isRead : { type: Boolean, default: false },
    message:{type:String}
},{timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);