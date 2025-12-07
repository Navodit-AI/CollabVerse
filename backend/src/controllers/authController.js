import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const signup = async (req, res) => {
  console.log("✅ SIGNUP endpoint hit");
  try {
    const { name, email, password } = req.body;
    console.log("Incoming data:", req.body);

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    console.log("✅ User created:", newUser);

    // 4. Generate JWT token
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);

    // 5. Send success response with token
    res.status(201).json({ message: "User created successfully", token, user: newUser });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};
export const login = async (req, res) => {
  console.log("✅ LOGIN endpoint hit");
  try {
    const { email, password } = req.body;
    console.log("Incoming login data:", { email, hasPassword: !!password });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid password" });
    }

    // 3. Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    console.log("✅ Login successful for user:", email);

    // 4. Send success response
    res.json({ message: "Login success", token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

