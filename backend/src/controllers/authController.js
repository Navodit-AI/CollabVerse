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

    // 4. Send success response
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};
