import { User } from "../models/User.js";

export const searchFriendsByName = async (req, res) => {
    const { name } = req.query;
    
    if (!name) {
        return res.status(400).json({ message: "Name query parameter is required" });
    }
    
    try {
        const users = await User.find({
        name: { $regex: name, $options: "i" }, // Case-insensitive search
        }).select("name email profilePicture");
    
        if (users.length === 0) {
        return res.status(404).json({ message: "No users found" });
        }
    
        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
    }


    export const getFriendByEmail = async (req, res) => {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ message: "Email query parameter is required" });
        }
        
        try {
            const user = await User.findOne({ email }).select("name email profilePicture");
        
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
        
            res.status(200).json(user);
        } catch (error) {
            console.error("Error searching for user by email:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }