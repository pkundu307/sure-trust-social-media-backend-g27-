import express from 'express';
import { getFriendByEmail, searchFriendsByName } from '../controllers/friends.controller.js';

const router = express.Router();
function consoleLogMiddleware(req, res, next) {
    console.log('Middleware executed');
    next();
}
router.get('/search-friends',searchFriendsByName)
router.get('/profile-by-email',getFriendByEmail)

export default router;