import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

const app = express();

// Render runs one proxy in front of the app; trust it so req.ip is the real client IP
// (rate limits would otherwise treat every user as the same address).
app.set("trust proxy", 1);

// ✅ CORS: restrict to FRONTEND_URL (comma-separated list allowed) when set; otherwise allow all (dev)
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: false,
}));

app.use(express.json({ limit: "200kb" }));

// ✅ Request logger (never log headers — they contain users' Authorization tokens)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ✅ Root route
app.get("/", (req, res) => {
  console.log("✅ Root route hit");
  res.send("✅ Server is alive!");
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/requests", requestRoutes);

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
