import prisma from "../utils/prisma.js";
import { isValidObjectId, validatePostInput } from "../utils/validate.js";

// CREATE
export const createPost = async (req, res) => {
  try {
    const { data, error } = validatePostInput(req.body);
    if (error) return res.status(400).json({ message: error });

    // status always starts as "Open" (schema default), even if the client sends one
    const { status: _ignored, ...fields } = data;
    const post = await prisma.post.create({
      data: { ...fields, authorId: req.user.id },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// READ ALL (search, filter, sort, paginate)
// Query params: page, limit, search, domain, skill, status, sort=newest|oldest, mine=1 (logged-in user's posts)
export const getPosts = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", domain, skill, status, sort = "newest", mine } = req.query;
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
    if (mine === "1") {
      if (!req.user) return res.status(401).json({ message: "Log in to see your projects" });
      AND.push({ authorId: req.user.id });
    }

    const where = AND.length ? { AND } : {};

    const userId = req.user?.id;

    const [rawPosts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
          // Only this user's like (0 or 1 rows) — tells the UI whether to show the heart filled
          ...(userId && { likes: { where: { authorId: userId }, select: { id: true } } }),
        },
        orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    // Pending join requests, counted only for the viewer's own posts on this page (others' stay private).
    const ownIds = userId ? rawPosts.filter((p) => p.authorId === userId).map((p) => p.id) : [];
    const pendingByPost = new Map();
    if (ownIds.length) {
      const groups = await prisma.joinRequest.groupBy({
        by: ["postId"],
        where: { postId: { in: ownIds }, status: "Pending" },
        _count: { _all: true },
      });
      for (const g of groups) pendingByPost.set(g.postId, g._count._all);
    }

    const posts = rawPosts.map(({ likes, ...post }) => ({
      ...post,
      likedByMe: Boolean(likes?.length),
      ...(post.authorId === userId && { pendingRequests: pendingByPost.get(post.id) ?? 0 }),
    }));

    res.json({
      data: posts,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// UPDATE (only by author)
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post ID" });

    const { data, error } = validatePostInput(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) return res.status(404).json({ message: "Post not found" });
    if (existingPost.authorId !== userId) return res.status(403).json({ message: "Forbidden" });

    const updated = await prisma.post.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post" });
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
    res.status(500).json({ message: "Failed to delete post" });
  }
};
