import express from "express";
import { respondToJoinRequest, withdrawJoinRequest } from "../controllers/joinRequestController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch("/:id", authenticate, respondToJoinRequest);   // owner accepts/declines
router.delete("/:id", authenticate, withdrawJoinRequest);   // requester withdraws

export default router;
