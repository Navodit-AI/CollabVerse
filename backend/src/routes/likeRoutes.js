import express from "express";
import { toggleLike, getLikes } from "../controllers/likeController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:postId", getLikes); // Public read
router.post("/", authenticate, toggleLike);

export default router;
