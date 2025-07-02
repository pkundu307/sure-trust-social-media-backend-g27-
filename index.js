import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectToDatabase } from "./utilities/DbConnect.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.routes.js";
import friendRequestRoutes from "./routes/friendRequest.routes.js";
import friendRoutes from "./routes/friend.route.js";

import { Chat } from "./models/chat.schema.js";
import { Message } from "./models/message.schema.js";

const app = express();
const server = http.createServer(app);

// ⚡ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Change to your frontend origin in production
    methods: ["GET", "POST"],
  },
});

const usersSocketMap = new Map(); // userId => socket.id

// 🌐 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛣️ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/friendRequest", friendRequestRoutes);
app.use("/api/friends", friendRoutes);

// 🌍 DB Connection
connectToDatabase();

// ⚡ Socket.IO logic
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("setup", (userId) => {
    usersSocketMap.set(userId, socket.id);
    socket.join(userId); // Join room by userId
    console.log(`🟢 User ${userId} joined socket`);
  });

  socket.on("send_message", async ({ senderId, receiverId, content }) => {
    try {
      // 1. Find or create Chat
      let chat = await Chat.findOne({
        isGroupChat: false,
        users: { $all: [senderId, receiverId] },
      });

      if (!chat) {
        chat = await Chat.create({ users: [senderId, receiverId] });
      }

      // 2. Create Message
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        chat: chat._id,
      });

      // 3. Update chat's latestMessage
      chat.latestMessage = message._id;
      await chat.save();

      // 4. Emit to both users
      const populatedMsg = await message.populate(
        "sender",
        "name profilePicture"
      );
      io.to(senderId).emit("receive_message", populatedMsg);
      io.to(receiverId).emit("receive_message", populatedMsg);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of usersSocketMap.entries()) {
      if (sockId === socket.id) usersSocketMap.delete(userId);
    }
    console.log("🚫 Socket disconnected:", socket.id);
  });
});

// 🟢 Start Server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
