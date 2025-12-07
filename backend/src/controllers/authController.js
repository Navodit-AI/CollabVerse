import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

// Helper to validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const signup = async (req, res) => {
  console.log("✅ SIGNUP endpoint hit");
  try {
    const { name, email, password } = req.body;
    console.log("Incoming data:", { name, email, password: password ? "***" : undefined });

    // --- Validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // --- 1. Check if user exists ---
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("❌ Database Error (findUnique):", dbError);
      if (dbError.message && dbError.message.includes("Server selection timeout")) {
        return res.status(503).json({
          error: "Database connection failed",
          message: "Unable to connect to the database. Please check your network or try again later."
        });
      }
      throw dbError; // Rethrow if it's not the specific timeout we handled
    }

    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(409).json({ message: "User already exists with this email" });
    }

    // --- 2. Hash password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- 3. Create user ---
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    console.log("✅ User created:", newUser.id);

    // --- 4. Generate JWT token ---
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // --- 5. Send success response ---
    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (err) {
    console.error("❌ Signup error:", err);

    // Handle database connection errors specifically (catch-all for create/find)
    if (err.message && (err.message.includes("Server selection timeout") || err.message.includes("connect ETIMEDOUT"))) {
      return res.status(503).json({
        error: "Database connection failed",
        message: "Service temporarily unavailable due to database connection issues."
      });
    }

    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

export const login = async (req, res) => {
  console.log("✅ LOGIN endpoint hit");
  try {
    const { email, password } = req.body;
    console.log("Incoming login data:", { email, hasPassword: !!password });

    // --- Validation ---
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // --- 1. Find user ---
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("❌ Database Error (findUnique):", dbError);
      if (dbError.message && dbError.message.includes("Server selection timeout")) {
        return res.status(503).json({
          error: "Database connection failed",
          message: "Unable to connect to the database. Please check your network or try again later."
        });
      }
      throw dbError;
    }

    if (!user) {
      console.log("User not found:", email);
      // Return 401 or 404. 400/401 is often better for security (not gathering emails), but 404 is clear for dev.
      // Let's stick to helpful but safe.
      return res.status(404).json({ message: "User not found" });
    }

    // --- 2. Verify password ---
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // --- 3. Generate JWT token ---
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.log("✅ Login successful for user:", email);

    // --- 4. Send success response ---
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error("❌ Login error:", err);

    if (err.message && (err.message.includes("Server selection timeout") || err.message.includes("connect ETIMEDOUT"))) {
      return res.status(503).json({
        error: "Database connection failed",
        message: "Service temporarily unavailable due to database connection issues."
      });
    }

    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

