import express from "express";
import { addComment, getComments, deleteComment } from "../controllers/commentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:postId", getComments); // Public read
router.post("/", authenticate, addComment);
router.delete("/:id", authenticate, deleteComment);

export default router;
