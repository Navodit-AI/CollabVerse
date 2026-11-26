import express from "express";
import { signup, login } from "../controllers/authController.js";
import { loginLimiter, signupLimiter } from "../middleware/rateLimit.js";


const router = express.Router();

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);


export default router;
