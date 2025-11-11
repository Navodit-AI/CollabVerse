import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// ✅ Middleware (temporarily open CORS)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.use(express.json());

// ✅ Debug logger
app.use((req, res, next) => {
  console.log("✅ Request received:", req.method, req.url);
  console.log("Headers:", req.headers);
  next();
});

// ✅ Root route
app.get("/", (req, res) => {
  console.log("✅ Root route hit");
  res.send("✅ Server is alive!");
});

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
