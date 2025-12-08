import prisma from "../utils/prisma.js";

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
        skills: Array.isArray(skills) ? skills : [],
        authorId,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
};

// READ ALL
export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};

// UPDATE (only by author)
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, domain, skills, status } = req.body;
    const userId = req.user.id;

    // Check ownership
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) return res.status(404).json({ message: "Post not found" });
    if (existingPost.authorId !== userId) return res.status(403).json({ message: "Forbidden" });

    const updated = await prisma.post.update({
      where: { id },
      data: { title, description, domain, skills, status },
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
