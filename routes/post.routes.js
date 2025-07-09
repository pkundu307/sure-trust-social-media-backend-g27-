import express from 'express'
import { 
  addComment, 
  addPost, 
  getAllPosts, 
  getMyAllPosts, 
  likePost,
  deletePost              // delete
} from '../controllers/post.controller.js';

import { protect } from '../utilities/protechjwt.js';

const router = express.Router();

router.post('/add', protect, addPost);
router.get('/all', protect, getAllPosts);
router.get('/allofme', protect, getMyAllPosts);
router.post('/like/:id', protect, likePost);
router.post('/comment/:id', protect, addComment);

// task 1 route added
router.delete('/post/:id', protect, deletePost);

export default router;
