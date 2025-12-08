import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

prisma.$connect()
  .then(() => console.log("✅ Prisma connected"))
  .catch(err => console.error("❌ Prisma connection failed:", err));

export default prisma;
