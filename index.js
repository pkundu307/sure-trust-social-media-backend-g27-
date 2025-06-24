import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './utilities/DbConnect.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.route.js'
import postRoutes from './routes/post.routes.js'
import friendRequestRoutes from './routes/friendRequest.routes.js';
const server= express();
server.use(cors());

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use('/api/auth', authRoutes);
server.use('/api/user', userRoutes); // Assuming user routes are also under authRoutes
server.use('/api/post',postRoutes)
server.use('/api/friendRequest',friendRequestRoutes)


connectToDatabase()
const PORT=3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});