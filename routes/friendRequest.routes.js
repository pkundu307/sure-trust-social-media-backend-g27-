import express from 'express';
import { sendFriendRequest } from '../controllers/friendRequest.controller.js';
import { protect } from '../utilities/protechjwt.js';

const router = express.Router();

router.post('/send', protect,sendFriendRequest);

export default router;