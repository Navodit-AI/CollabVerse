import prisma from "../utils/prisma.js";
import { isValidObjectId } from "../utils/validate.js";

// ADD COMMENT
export const addComment = async (req, res) => {
    try {
        const { postId } = req.body;
        const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
        const authorId = req.user.id; // from auth middleware

        if (!postId || !content) {
            return res.status(400).json({ message: "Post ID and content are required" });
        }
        if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post ID" });

        // MongoDB doesn't enforce relations, so check the post exists to avoid orphan comments
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId,
            },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add comment", error: err.message });
    }
};

// GET COMMENTS FOR A POST
export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post ID" });

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                author: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "asc" } // Oldest first is standard for threads
        });

        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch comments", error: err.message });
    }
};

// DELETE COMMENT
export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid comment ID" });
        const userId = req.user.id;

        const comment = await prisma.comment.findUnique({ where: { id } });
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // Allow deletion if user owns the comment OR owns the post (optional, but good for moderation)
        // For now, simple ownership check:
        if (comment.authorId !== userId) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        await prisma.comment.delete({ where: { id } });
        res.json({ message: "Comment deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete comment", error: err.message });
    }
};
