import { createNotification,getMyNotifications,markAsRead } from "../controllers/notification.controller.js";
import express from "express"
import { protect } from "../utilities/protechjwt.js";

const router= express.Router()

router.post('/create',protect,createNotification)
router.put('/:notificationId/read',protect,markAsRead)
router.get('/getall',protect,getMyNotifications)

export default router;