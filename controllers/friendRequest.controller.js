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

export const getAllFriendRequest = async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return res.status(400).json({ message: "invalid request" });
    }
    try {
        const friendRequests = await FriendRequest.find({ to: userId, status: "pending" })
            .populate("from", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json(friendRequests);
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const acceptFriendRequest = async (req, res) => {
    const userId = req.user.userId;
    
    const requestId= req.params.id;
    console.log(userId, requestId);
    
    if (!userId || !requestId) {
        return res.status(400).json({ message: "Invalid request" });
    }

    try {
       const request = await FriendRequest.findById(requestId);
        if (!request || request.status !== "pending" || request.to.toString() !== userId) {
            return res.status(404).json({ message: "Friend request not found" });
        }




        request.status = "accepted";
        await request.save();

        await User.findByIdAndUpdate(request.from, {
            $addToSet: { followers: request.to } // Add userId to the followers array
        });
        await User.findByIdAndUpdate(request.to, {
            $addToSet: { followers: request.from } // Add fromUserId to the followers array
        });

        res.status(200).json({ message: "Friend request accepted", request });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllFriends = async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).populate('followers', 'name email')
      console.log(user);
      
      res.json(user.followers);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch friends' });
    }
  };
  