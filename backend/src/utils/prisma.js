import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

// Catch a stale generated client early (e.g. a cached build that skipped `prisma generate`):
// missing models otherwise surface later as "Cannot read properties of undefined (reading 'findMany')".
const EXPECTED_MODELS = ["user", "post", "comment", "like", "joinRequest"];
const missing = EXPECTED_MODELS.filter((m) => !prisma[m]);
if (missing.length) {
  console.error(`❌ Prisma client is out of date (missing: ${missing.join(", ")}). Run "npx prisma generate" and redeploy.`);
}

prisma.$connect()
  .then(() => console.log("✅ Prisma connected"))
  .catch(err => console.error("❌ Prisma connection failed:", err));

export default prisma;
