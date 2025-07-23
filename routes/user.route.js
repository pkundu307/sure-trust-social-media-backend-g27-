import express from 'express';
import { getProfile, updateProfile, forgotPassword, resetPassword } from '../controllers/user.controller.js';
import { protect } from '../utilities/protechjwt.js';
import multer from "multer";
import cloudinary from "../utilities/cloudinary.js";
import { User } from "../models/User.js";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ Get profile
router.get("/me", protect, getProfile);

// ✅ Update profile (name, email, bio, profilePic)
router.put("/update", protect, updateProfile);

// ✅ Password Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ✅ Upload Profile Picture
router.post("/upload-profile-pic", protect, upload.single("image"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No image file uploaded" });
        }

        const result = await cloudinary.uploader.upload(file.path, {
            folder: "profile_pics",
        });

        fs.unlinkSync(file.path); // remove local temp file

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profilePic: result.secure_url },
            { new: true }
        ).select("-password");

        res.json({ message: "Image uploaded successfully", user });
    } catch (error) {
        console.error("Image upload failed:", error);
        res.status(500).json({ message: "Image upload failed" });
    }
});

export default router;
