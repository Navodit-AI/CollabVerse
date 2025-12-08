import express from "express";
import { getUsers, updateProfile } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getUsers);
router.put("/profile", authenticate, updateProfile);

export default router;
