import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectToDatabase } from "./utilities/DbConnect.js";
import { configDotenv } from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.routes.js";
import friendRequestRoutes from "./routes/friendRequest.routes.js";
import friendRoutes from "./routes/friend.route.js";
import chatRoutes from "./routes/chat.route.js";
import storyRoutes from "./routes/story.routes.js"
import notificationRoutes from "./routes/notification.route.js"
import { Chat } from "./models/chat.schema.js";
import { Message } from "./models/message.schema.js";
import cloudinary from "cloudinary";
import multer from "multer";

configDotenv();

const app = express();
const server = http.createServer(app);

// ✅ CORRECT CORS SETUP
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ Your frontend URL
    credentials: true,
  })
);

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
global.io = io;
const usersSocketMap = new Map();
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/friendRequest", friendRequestRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chat",chatRoutes)
app.use("/api/story",storyRoutes)
app.use('/api/notification',notificationRoutes)
// 🌍 DB Connection
connectToDatabase();

// ⚡ Socket.IO logic
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("setup", (userId) => {
    usersSocketMap.set(userId, socket.id);
    socket.join(userId);
    console.log(`🟢 User ${userId} joined socket`);
  });

  socket.on("send_message", async ({ senderId, receiverId, content }) => {
    try {
      let chat = await Chat.findOne({
        isGroupChat: false,
        users: { $all: [senderId, receiverId] },
      });

      if (!chat) {
        chat = await Chat.create({ users: [senderId, receiverId] });
      }

      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        chat: chat._id,
      });

      chat.latestMessage = message._id;
      await chat.save();

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

// ✅ CLOUDINARY UPLOAD
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

const storage = new multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("my_file"), async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI);
    res.json(cldRes);
  } catch (error) {
    console.log(error);
    res.send({ message: error.message });
  }
});

// ✅ DB CONNECTION
connectToDatabase();

// ✅ START SERVER
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
console.log("just checking")