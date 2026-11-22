import prisma from "../utils/prisma.js";
import { isValidObjectId } from "../utils/validate.js";

// TOGGLE LIKE (Like / Unlike)
export const toggleLike = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;

        if (!postId) return res.status(400).json({ message: "Post ID is required" });
        if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post ID" });

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Check if like exists
        const existingLike = await prisma.like.findUnique({
            where: {
                authorId_postId: {
                    authorId: userId,
                    postId: postId
                }
            }
        });

        if (existingLike) {
            // UNLIKE
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return res.json({ message: "Unliked", liked: false });
        } else {
            // LIKE
            await prisma.like.create({
                data: {
                    authorId: userId,
                    postId
                }
            });
            return res.json({ message: "Liked", liked: true });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to toggle like", error: err.message });
    }
};

// GET LIKES FOR A POST
export const getLikes = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post ID" });
        // Public endpoint: returns count + liker IDs; the client checks if its own ID is in likedBy.

        const likes = await prisma.like.findMany({
            where: { postId },
            select: { authorId: true }
        });

        res.json({
            count: likes.length,
            likedBy: likes.map(l => l.authorId)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch likes", error: err.message });
    }
};
