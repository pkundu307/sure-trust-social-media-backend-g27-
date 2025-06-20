import express from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../utilities/protechjwt.js';

const router = express.Router();

router.get('/me',protect, getProfile);
router.put('/me', protect, updateProfile);

export default router;