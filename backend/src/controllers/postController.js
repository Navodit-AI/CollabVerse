import prisma from "../utils/prisma.js";
import { isValidObjectId } from "../utils/validate.js";

// CREATE
export const createPost = async (req, res) => {
  try {
    const { title, description, domain, skills } = req.body;
    const authorId = req.user.id;

    if (!title || !description || !domain) {
      return res.status(400).json({ message: "Title, description, and domain are required" });
    }

    const post = await prisma.post.create({
      data: {
        title,
        description,
        domain,
        skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
        authorId,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
};

// READ ALL (search, filter, sort, paginate)
// Query params: page, limit, search, domain, skill, status, sort=newest|oldest
export const getPosts = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", domain, skill, status, sort = "newest" } = req.query;
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(50, parseInt(limit) || 10));

    const AND = [];
    if (search) {
      AND.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (domain && domain !== "All") AND.push({ domain: { equals: domain } });
    if (skill) AND.push({ skills: { has: skill } });
    if (status && status !== "All") AND.push({ status: { equals: status } });

    const where = AND.length ? { AND } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      data: posts,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};

// UPDATE (only by author)
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post ID" });

    const { title, description, domain, skills, status } = req.body;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) return res.status(404).json({ message: "Post not found" });
    if (existingPost.authorId !== userId) return res.status(403).json({ message: "Forbidden" });

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title,
        description,
        domain,
        skills: Array.isArray(skills) ? skills.filter(Boolean) : undefined,
        status,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post", error: err.message });
  }
};

// DELETE (only by author)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post ID" });

    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) return res.status(404).json({ message: "Post not found" });
    if (existingPost.authorId !== userId) return res.status(403).json({ message: "Forbidden" });

    await prisma.post.delete({ where: { id } });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
};
