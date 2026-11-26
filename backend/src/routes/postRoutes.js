import express from "express";
import { createPost, getPosts, updatePost, deletePost } from "../controllers/postController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { createJoinRequest, getJoinRequests } from "../controllers/joinRequestController.js";

const router = express.Router();

router.get("/", optionalAuth, getPosts); // Public fetch; personalised when logged in
router.post("/", authenticate, createPost);
router.put("/:id", authenticate, updatePost);
router.delete("/:id", authenticate, deletePost);

// Join requests for a project
router.get("/:id/requests", optionalAuth, getJoinRequests);
router.post("/:id/requests", authenticate, createJoinRequest);

export default router;
