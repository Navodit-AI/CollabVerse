import express from "express";
import { createPost, getPosts, updatePost, deletePost } from "../controllers/postController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getPosts); // Public fetch; personalised when logged in
router.post("/", authenticate, createPost);
router.put("/:id", authenticate, updatePost);
router.delete("/:id", authenticate, deletePost);

export default router;
