import express from 'express';
import { acceptFriendRequest, getAllFriendRequest, getAllFriends, sendFriendRequest } from '../controllers/friendRequest.controller.js';
import { protect } from '../utilities/protechjwt.js';

const router = express.Router();

router.post('/send', protect,sendFriendRequest);
router.get('/all', protect, getAllFriendRequest);
router.get('/allfriends',protect,getAllFriends)
router.put('/accept/:id', protect, acceptFriendRequest);
export default router;