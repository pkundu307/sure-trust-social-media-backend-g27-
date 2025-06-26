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
  export const getMutualFriends = async (req, res) => {
    const userId = req.user.userId;
  
    try {
      // Get logged-in user's friends
      const user = await User.findById(userId).populate('followers', '_id name');

      const userFriendIds = user.followers.map(friend => friend._id.toString());
    
      const mutualMap = new Map();
  
      // Loop through each friend and check their friends
      for (const friend of user.followers) {
        const friendData = await User.findById(friend._id).populate('followers', '_id name profilePicture');
        
        friendData.followers.forEach((f) => {
          const fId = f._id.toString();
            console.log(fId);
            
          // Check if this friend is also in my friend list and not me
        //   if (fId !== userId && userFriendIds.includes(fId)) {
            mutualMap.set(fId, f); // ensure uniqueness
        //   }
        });
      }
  
      let mutualFriends = Array.from(mutualMap.values());
      mutualFriends = mutualFriends.filter(friend => friend._id.toString() !== userId); // Exclude self
      console.log(mutualFriends, 'mutualFriends');
      res.status(200).json(mutualFriends);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to get mutual friends' });
    }
  };
  