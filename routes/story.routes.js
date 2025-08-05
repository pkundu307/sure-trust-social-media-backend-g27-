import { uploadStory,upload, getAllStories,markStoryWatched } from "../controllers/story.controller.js";

import express from 'express'
import { protect } from "../utilities/protechjwt.js";
const router = express.Router();

router.post('/upload',protect,upload.single('image'),uploadStory)
router.get('/all',protect,getAllStories)
router.put('/mark-watched/:id', protect, markStoryWatched);


export default router;