import express from "express";
import {
    createProject,
    getProjects,
    updateProject,
    deleteProject
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createProject);
router.get("/", getProjects);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
