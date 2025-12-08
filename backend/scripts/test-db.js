import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Testing MongoDB Connection...");
    console.log(`📌 Database URL from .env: ${process.env.DATABASE_URL ? "Loaded (Hidden)" : "MISSING!"}`);

    try {
        console.log("⏳ Attempting to connect...");
        await prisma.$connect();
        console.log("✅ SUCCESS: Connected to MongoDB successfully!");

        const userCount = await prisma.user.count();
        console.log(`📊 Current User Count: ${userCount}`);

    } catch (error) {
        console.error("❌ FAILED: Could not connect to MongoDB.");
        console.error("\n--- Error Details ---");
        console.error(error.message);

        if (error.message.includes("Timed out")) {
            console.error("\n⚠️  DIAGNOSIS: TIMEOUT");
            console.error("This almost always means your IP ADDRESS is not whitelisted in MongoDB Atlas.");
            console.error("1. Go to MongoDB Atlas > Network Access.");
            console.error("2. Click 'Add IP Address'.");
            console.error("3. Select 'Add Current IP Address' (or Allow Access from Anywhere 0.0.0.0/0 for testing).");
        } else if (error.message.includes("Authentication failed")) {
            console.error("\n⚠️  DIAGNOSIS: AUTH FAILURE");
            console.error("Check your username and password in the connection string.");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
