import prisma from "../utils/prisma.js";

// Helper for standardized error responses
const handleError = (res, error, action) => {
    console.error(`❌ ${action} Error:`, error);

    // DB Connection / Timeout Errors
    if (error.message && (error.message.includes("Timed out") || error.message.includes("Server selection timeout"))) {
        return res.status(503).json({
            message: "Database connection timed out. Please check your network or whitelist IP.",
            code: "DB_TIMEOUT"
        });
    }

    // Prisma Unique Constraint Errors
    if (error.code === 'P2002') {
        return res.status(409).json({ message: "A post with this details already exists." });
    }

    res.status(500).json({ message: `Failed to ${action.toLowerCase()}.`, error: error.message });
};

// ✅ CREATE POST
export const createPost = async (req, res) => {
    try {
        const { title, description, domain, skills } = req.body;
        const authorId = req.user.id;

        // Validation
        if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });
        if (!description || !description.trim()) return res.status(400).json({ message: "Description is required" });
        if (!domain) return res.status(400).json({ message: "Domain is required" });

        const post = await prisma.post.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                domain,
                skills: Array.isArray(skills) ? skills : [],
                authorId
            },
            include: { author: { select: { name: true } } }
        });

        console.log(`✅ Post Created: ${post.id} by ${req.user.id}`);
        res.status(201).json(post);
    } catch (error) {
        handleError(res, error, "Create Post");
        console.log(error)
    }
};

// ✅ GET POSTS (Advanced Search/Filter)
export const getPosts = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", domain, status, sortBy = "createdAt", order = "desc" } = req.query;
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, Math.min(50, parseInt(limit)));

        const where = { AND: [] };

        if (search) {
            where.AND.push({
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } }
                ]
            });
        }

        if (domain && domain !== "All") where.AND.push({ domain: { equals: domain } });
        if (status) where.AND.push({ status: { equals: status } });

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                include: { author: { select: { name: true, role: true } } }
            }),
            prisma.post.count({ where })
        ]);

        res.json({
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        handleError(res, error, "Fetch Posts");
    }
};

// ✅ DELETE POST
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.authorId !== req.user.id) return res.status(403).json({ message: "Unauthorized to delete this post" });

        await prisma.post.delete({ where: { id } });
        console.log(`🗑️ Post Deleted: ${id}`);
        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        handleError(res, error, "Delete Post");
    }
};
