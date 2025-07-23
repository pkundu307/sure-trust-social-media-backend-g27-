import { User } from "../models/User.js";
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';



export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetching profile failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateProfile = async (req, res) => {
    const { name, email, bio, profilePic } = req.body; // ✅ Use profilePic consistently

    if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, email, bio, profilePic }, // ✅ Save the image URL here
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