import express from "express";
import {
  addComment,
  addPost,
  upload,
  getAllPosts,
  getMyAllPosts,
  likePost,
  deletePost, // delete post
  softDeletePost,
  restorePost,
  getMyDeletedPosts, // soft delete
} from "../controllers/post.controller.js";

import { protect } from "../utilities/protechjwt.js";

const router = express.Router();

router.post('/add', protect, upload.single('image'), addPost);

router.get("/all", protect, getAllPosts);
router.get("/allofme", protect, getMyAllPosts);
router.post("/like/:id", protect, likePost);
router.post("/comment/:id", protect, addComment);

// task 1 route added
router.put("/softDelete/:id", protect, softDeletePost);
router.put("/restore/:id", protect, restorePost);
router.delete("/:id", protect, deletePost);
router.get('/deleted', protect, getMyDeletedPosts);

export default router;
