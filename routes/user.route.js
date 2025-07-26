import express from 'express';
import {
  getProfile,
  updateProfile,
  updateProfilePic,
  removeProfilePic,
  forgotPassword,
  resetPassword,
} from '../controllers/user.controller.js';
import { protect } from '../utilities/protechjwt.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utilities/cloudinary.js';
import { upload } from '../controllers/post.controller.js';

const router = express.Router();

// ✅ Cloudinary storage config
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'profile-pictures',
//     allowed_formats: ['jpg', 'jpeg', 'png'],
//     public_id: (req, file) => `user-${req.user.userId}-${Date.now()}`,
//   },
// });

// const upload = multer({ storage });

// ✅ Routes
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/me/profile-pic',protect, upload.single('image'), updateProfilePic);
router.delete('/me/profile-pic', protect, removeProfilePic);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
