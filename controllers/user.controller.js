import { User } from "../models/User.js";
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import cloudinary from "cloudinary";
import multer from "multer";

// --- Cloudinary Configuration ---
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// --- Cloudinary Upload Helper ---
async function handleUpload(file) {
  const res = await cloudinary.v2.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

// --- Multer Configuration ---
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfilePic = async (req, res) => {
  try {
    // 1. Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    // 2. Find the user in the database
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 3. If the user already has a profile picture, delete the old one from Cloudinary
    if (user.profilePicture && user.profilePicture.public_id) {
      await cloudinary.v2.uploader.destroy(user.profilePicture.public_id);
    }

    // 4. Convert the buffer to a Data URI and upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI);

    // 5. ✅ **THE FIX:** Save the URL and public_id from the Cloudinary response
    user.profilePicture = {
      url: cldRes.secure_url,    // Use the URL from the Cloudinary response
      public_id: cldRes.public_id, // Use the public_id from the Cloudinary response
    };
    
    // 6. Save the updated user document to the database
    await user.save();

    // 7. Prepare the user object for the response (without the password)
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      message: "Profile picture updated successfully",
      user: updatedUser, // Send back the updated user object
    });
    
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error while updating profile picture." });
  }
};




export const updateProfile = async (req, res) => {
    const { name,bio, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, email,bio },
            { new: true, runValidators: true }
        ).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// ----------------------
// ✅ Remove Profile Picture
// ----------------------
export const removeProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Delete from Cloudinary
    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }

    // ✅ Remove from MongoDB
    user.profilePicture = null;
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      message: "Profile picture removed successfully",
      ...updatedUser,
    });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ message: "Failed to remove profile picture" });
  }
};







export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      text: `Your OTP code is: ${code}`,

    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ----------------------
// ✅ Reset Password
// ----------------------
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid code or email" });
    }

    user.password = newPassword; // Will be hashed by pre('save') in User model
    user.resetCode = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
};