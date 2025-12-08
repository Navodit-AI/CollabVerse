import express from "express";
import { createPost, getPosts, deletePost } from "../controllers/postController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, createPost);
router.get("/", authenticate, getPosts);
router.delete("/:id", authenticate, deletePost);

export default router;
