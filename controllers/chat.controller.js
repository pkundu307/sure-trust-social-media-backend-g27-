import { Chat } from "../models/chat.schema.js";
import { Message } from "../models/message.schema.js";

export const getChatHistory = async (req, res) => {
    const {userId}=req.user.userId;
    const {friendId} = req.params.friendId;

    try {
        let chat = await Chat.findOne({isGroupChat:false,
            user: { $all: [userId, friendId] }})
            if(!chat) {
                return res.status(404).json({ message: "Chat not found" });
            }
            const messages = await Message.find({ chat: chat._id })
                .populate("sender", "name profilePicture")
                .populate("chat")
                .sort({ createdAt: 1 }); 
            console.log(messages);
            
                res.status(200).json(messages)
        
        } catch (error) {
        console.error("Error fetching chat history:", error);
    }
}

