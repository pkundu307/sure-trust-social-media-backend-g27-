import express from "express";
import { protect } from "../utilities/protechjwt.js";
import { getChatHistory } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/:friendId", protect,getChatHistory)

export default router;