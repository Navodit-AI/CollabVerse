import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};
