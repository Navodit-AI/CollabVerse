import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// ✅ CORS Configuration - Allow all origins for now
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false,
}));

app.use(express.json());

// ✅ Debug logger (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("✅ Request received:", req.method, req.url);
    console.log("Headers:", req.headers);
    next();
  });
}

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
