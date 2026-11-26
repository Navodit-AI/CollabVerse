import prisma from "../utils/prisma.js";
import { LIMITS, isValidObjectId } from "../utils/validate.js";

const USER_FIELDS = { id: true, name: true, role: true, skills: true };

// GET /api/posts/:id/requests
// Everyone sees the team (owner + accepted members). Logged-in users also get `mine`
// (their own request, if any); the owner additionally gets every request.
export const getJoinRequests = async (req, res) => {
  try {
    const { id: postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post ID" });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, author: { select: USER_FIELDS } },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user?.id;
    const isOwner = userId === post.authorId;

    const requests = await prisma.joinRequest.findMany({
      where: isOwner ? { postId } : { postId, OR: [{ status: "Accepted" }, ...(userId ? [{ userId }] : [])] },
      include: { user: { select: USER_FIELDS } },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      isOwner,
      team: [post.author, ...requests.filter((r) => r.status === "Accepted").map((r) => r.user)],
      mine: userId ? requests.find((r) => r.userId === userId) ?? null : null,
      requests: isOwner ? requests : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load join requests" });
  }
};

// POST /api/posts/:id/requests  { message? }
export const createJoinRequest = async (req, res) => {
  try {
    const { id: postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post ID" });

    const raw = req.body?.message ?? "";
    if (typeof raw !== "string") return res.status(400).json({ message: "Message must be text" });
    const message = raw.trim();
    if (message.length > LIMITS.joinMessage) {
      return res.status(400).json({ message: `Message must be ${LIMITS.joinMessage} characters or less` });
    }

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, status: true } });
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.authorId === req.user.id) return res.status(400).json({ message: "You can't ask to join your own project" });
    if (post.status !== "Open") return res.status(400).json({ message: "This project isn't taking new members" });

    const existing = await prisma.joinRequest.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } },
    });
    if (existing) return res.status(409).json({ message: "You've already asked to join this project" });

    const request = await prisma.joinRequest.create({
      data: { postId, userId: req.user.id, message },
      include: { user: { select: USER_FIELDS } },
    });
    res.status(201).json(request);
  } catch (err) {
    // P2002 = unique constraint: a double-click raced past the check above
    if (err?.code === "P2002") return res.status(409).json({ message: "You've already asked to join this project" });
    console.error(err);
    res.status(500).json({ message: "Failed to send join request" });
  }
};

// PATCH /api/requests/:id  { status: "Accepted" | "Declined" }  (project owner only, pending requests only)
export const respondToJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid request ID" });
    const { status } = req.body ?? {};
    if (status !== "Accepted" && status !== "Declined") {
      return res.status(400).json({ message: "Status must be Accepted or Declined" });
    }

    const request = await prisma.joinRequest.findUnique({
      where: { id },
      include: { post: { select: { authorId: true } } },
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.post.authorId !== req.user.id) return res.status(403).json({ message: "Only the project owner can respond" });
    if (request.status !== "Pending") return res.status(409).json({ message: `This request was already ${request.status.toLowerCase()}` });

    const updated = await prisma.joinRequest.update({
      where: { id },
      data: { status },
      include: { user: { select: USER_FIELDS } },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update join request" });
  }
};

// DELETE /api/requests/:id  (requester withdraws a pending request)
export const withdrawJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid request ID" });

    const request = await prisma.joinRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.userId !== req.user.id) return res.status(403).json({ message: "You can only withdraw your own request" });
    if (request.status !== "Pending") return res.status(409).json({ message: "Only pending requests can be withdrawn" });

    await prisma.joinRequest.delete({ where: { id } });
    res.json({ message: "Request withdrawn" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to withdraw join request" });
  }
};
