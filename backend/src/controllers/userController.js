import prisma from "../utils/prisma.js";

const ALLOWED_ROLES = ["User", "Developer", "Designer", "Manager"];

// ✅ GET USERS (Find Peers)
export const getUsers = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", role, skill } = req.query;
        page = Math.max(1, parseInt(page) || 1);
        limit = Math.max(1, Math.min(50, parseInt(limit) || 10));

        const where = {
            AND: []
        };

        if (search) {
            where.AND.push({
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { skills: { has: search } }
                ]
            });
        }

        if (role && role !== "All") where.AND.push({ role: { equals: role } });

        // Very basic array filtering for now since Prisma Mongo array filtering can be tricky
        if (skill) {
            where.AND.push({ skills: { has: skill } });
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    skills: true,
                    createdAt: true
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

// ✅ UPDATE PROFILE
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { role, skills } = req.body;

        const data = {};
        if (role !== undefined) {
            if (!ALLOWED_ROLES.includes(role)) {
                return res.status(400).json({ message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` });
            }
            data.role = role;
        }
        if (skills !== undefined) {
            if (!Array.isArray(skills) || !skills.every((s) => typeof s === "string")) {
                return res.status(400).json({ message: "Skills must be an array of strings" });
            }
            data.skills = [...new Set(skills.map((s) => s.trim()).filter(Boolean))].slice(0, 20);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, name: true, email: true, role: true, skills: true }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile" });
    }
};
