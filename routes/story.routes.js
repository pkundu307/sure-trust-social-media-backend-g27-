import { uploadStory,upload, getAllStories } from "../controllers/story.controller.js";

import express from 'express'
import { protect } from "../utilities/protechjwt.js";
const router = express.Router();

router.post('/upload',protect,upload.single('image'),uploadStory)
router.get('/all',protect,getAllStories)

export default router;