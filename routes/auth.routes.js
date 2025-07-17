import express from "express";
import { login, register,changePassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post('/register',register)
router.post('/login', login);
router.put('/change-password',changePassword);

export default router;