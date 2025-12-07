import prisma from "../utils/prisma.js";

// Create a new Team
export const createTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id; // From authMiddleware

        if (!name) {
            return res.status(400).json({ message: "Team name is required" });
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                ownerId: userId,
                members: {
                    connect: { id: userId } // Auto-add owner as member
                }
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { select: { id: true, name: true, email: true } }
            }
        });

        res.status(201).json(team);
    } catch (error) {
        console.error("Create Team Error:", error);

        if (error.message && (error.message.includes("Server selection timeout") || error.message.includes("connect ETIMEDOUT"))) {
            return res.status(503).json({
                message: "Database connection failed. Check your IP whitelist.",
                error: "Service unavailable"
            });
        }

        res.status(500).json({ message: "Failed to create team", error: error.message });
    }
};

// Get Teams (with Pagination, Search, Sort)
export const getTeams = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const where = {};
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        // Execute query
        const [teams, total] = await Promise.all([
            prisma.team.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { [sortBy]: order.toLowerCase() },
                include: {
                    owner: { select: { name: true } },
                    _count: { select: { members: true, projects: true } }
                }
            }),
            prisma.team.count({ where })
        ]);

        res.json({
            data: teams,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Get Teams Error:", error);
        res.status(500).json({ message: "Failed to fetch teams", error: error.message });
    }
};

// Get Single Team
export const getTeam = async (req, res) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { select: { id: true, name: true, email: true } },
                projects: true
            }
        });

        if (!team) return res.status(404).json({ message: "Team not found" });
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: "Error fetching team" });
    }
};

// Update Team
export const updateTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        const team = await prisma.team.update({
            where: { id: req.params.id },
            data: { name, description }
        });
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: "Error updating team" });
    }
};

// Delete Team
export const deleteTeam = async (req, res) => {
    try {
        await prisma.team.delete({ where: { id: req.params.id } });
        res.json({ message: "Team deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting team" });
    }
};
