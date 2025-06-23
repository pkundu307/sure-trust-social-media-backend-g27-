import express from 'express'
import { addPost, getAllPosts } from '../controllers/post.controller.js';
import { protect } from '../utilities/protechjwt.js';

const router = express.Router();

router.post('/add',protect,addPost)
router.get('/all',protect,getAllPosts)
export default router;