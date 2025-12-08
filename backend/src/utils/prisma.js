import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"]
});

prisma.$connect().catch((err) => {
  console.error("❌ Prisma connection failed:", err.message);
});

export default prisma;
