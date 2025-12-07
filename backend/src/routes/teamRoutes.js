import express from "express";
import {
    createTeam,
    getTeams,
    getTeam,
    updateTeam,
    deleteTeam
} from "../controllers/teamController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/:id", getTeam);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);

export default router;
