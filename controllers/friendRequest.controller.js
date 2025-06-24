import { FriendRequest } from "../models/friendRequest.schema.js";
import { User } from "../models/User.js";

export const sendFriendRequest = async (req, res) => {
    const fromUserId= req.user.userId;
    const { to } = req.body;
    console.log(fromUserId);
    
    if(fromUserId === to) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }
    try {
        const alreadyExists = await FriendRequest.findOne({
            from: fromUserId,
            to: to
        });
        if (alreadyExists) {
            return res.status(400).json({ message: "Friend request already sent." });
        }

        const friendRequest = await FriendRequest.create({
            from: fromUserId,
            to: to,
            status: "pending"
        });
        res.status(201).json(friendRequest);
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ message: "Internal server error" });
        
    }
}