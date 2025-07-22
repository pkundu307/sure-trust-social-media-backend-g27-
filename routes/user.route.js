import express from 'express';
import { getProfile, updateProfile,forgotPassword,resetPassword } from '../controllers/user.controller.js';
import { protect } from '../utilities/protechjwt.js';
 // still needed for login, but not for reset
const router = express.Router();

// ✅ Routes
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
