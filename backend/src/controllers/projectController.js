import prisma from "../utils/prisma.js";

// Create Project
export const createProject = async (req, res) => {
    try {
        const { name, description, teamId, status } = req.body;

        if (!name || !teamId) {
            return res.status(400).json({ message: "Name and Team ID are required" });
        }

        // Verify team exists
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: "Team not found" });

        const project = await prisma.project.create({
            data: {
                name,
                description,
                teamId,
                status: status || "planned"
            }
        });

        res.status(201).json(project);
    } catch (error) {
        console.error("Create Project Error:", error);
        res.status(500).json({ message: "Failed to create project", error: error.message });
    }
};

// Get Projects (Filter by Team, Status + Pagination)
export const getProjects = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            status,
            teamId,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const where = {};
        if (search) where.name = { contains: search, mode: "insensitive" };
        if (status) where.status = status;
        if (teamId) where.teamId = teamId;

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { [sortBy]: order.toLowerCase() },
                include: {
                    team: { select: { name: true } }
                }
            }),
            prisma.project.count({ where })
        ]);

        res.json({
            data: projects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch projects" });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: { name, description, status }
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: "Error updating project" });
    }
};

export const deleteProject = async (req, res) => {
    try {
        await prisma.project.delete({ where: { id: req.params.id } });
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting project" });
    }
};
