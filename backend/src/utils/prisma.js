import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle connection errors gracefully
prisma.$connect().catch((err) => {
  console.error("❌ Failed to connect to database:", err.message);
  if (err.message.includes("Server selection timeout")) {
    console.error("💡 Tip: Check MongoDB Atlas IP whitelist - allow 0.0.0.0/0 or Render IPs");
  }
});

export default prisma;
