import express from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../utilities/protechjwt.js';
import { User } from '../models/User.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs'; // still needed for login, but not for reset
const router = express.Router();

// ✅ Routes
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);

// ✅ Send OTP to Email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = code;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    text: `Your OTP code is: ${code}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// ✅ Reset Password (without manual bcrypt.hash)
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const user = await User.findOne({ email });

  if (!user || user.resetCode !== code) {
    return res.status(400).json({ message: 'Invalid code or email' });
  }

  try {
    user.password = newPassword; // 🔐 will be hashed by pre("save")
    user.resetCode = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;
