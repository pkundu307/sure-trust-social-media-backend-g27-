import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './utilities/DbConnect.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.route.js'
import postRoutes from './routes/post.routes.js'
import friendRequestRoutes from './routes/friendRequest.routes.js';
import friendRoutes from './routes/friend.route.js';
const server= express();
server.use(cors());
function consoleLogMiddleware(req, res, next) {
    console.log('Middleware executed');
    next();
}
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use('/api/auth', authRoutes);
server.use('/api/user', userRoutes); // Assuming user routes are also under authRoutes
server.use('/api/post',postRoutes)
server.use('/api/friendRequest',friendRequestRoutes)
server.use('/api/friends',friendRoutes)

connectToDatabase()
const PORT=3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});