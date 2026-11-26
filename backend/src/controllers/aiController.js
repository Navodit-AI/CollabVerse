import { ApiError, GoogleGenAI } from "@google/genai";
import prisma from "../utils/prisma.js";

// Free-tier Gemini model (Google recommends it for new projects). Override with GEMINI_MODEL.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const MAX_HISTORY = 20;          // messages kept per request
const MAX_MESSAGE_CHARS = 4000;  // per message
const RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 }; // per user; also protects the shared free-tier quota

// Created lazily so the server still boots (and the rest of the API works) without a key.
let client;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

const SYSTEM_PROMPT = `You are Verse, the built-in assistant for CollabVerse, a platform where students and makers post project ideas and find collaborators.

You help users:
- shape a rough idea into a clear project post (title, one-paragraph pitch, domain, skills needed)
- find projects or peers on CollabVerse that match what they're looking for
- plan a project: scope, milestones, roles, and a sensible tech stack
- write a friendly message to invite a collaborator

Each project lists its current team. Use it to spot gaps: compare the skills a project needs with the roles already on its team, and point the user to projects where their skills fill a gap. Don't suggest projects the user owns or has already asked to join; mention the status of their requests if it's relevant.

Keep answers short and practical, and use markdown lists when helpful. When you mention a project from the platform, use its exact title. You only know the platform data included below; if something isn't there, say so instead of guessing.`;

// Simple in-memory limiter: enough for a single instance, resets on restart.
const hits = new Map();
const isRateLimited = (userId) => {
  const now = Date.now();
  const recent = (hits.get(userId) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  return false;
};

const validateMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  for (const [i, m] of messages.entries()) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return `messages[${i}].role must be "user" or "assistant"`;
    if (typeof m.content !== "string" || !m.content.trim()) return `messages[${i}].content must be a non-empty string`;
    if (m.content.length > MAX_MESSAGE_CHARS) return `messages[${i}] is too long (max ${MAX_MESSAGE_CHARS} characters)`;
  }
  if (messages[messages.length - 1].role !== "user") return "the last message must be from the user";
  return null;
};

// A snapshot of the platform so answers about "projects on CollabVerse" are grounded in real data.
// Exported for tests.
export const buildPlatformContext = async (userId) => {
  const [me, posts, peers, myRequests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true, skills: true } }),
    prisma.post.findMany({
      where: { status: "Open" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        title: true,
        description: true,
        domain: true,
        skills: true,
        authorId: true,
        author: { select: { name: true, role: true } },
        joinRequests: { where: { status: "Accepted" }, select: { user: { select: { name: true, role: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { id: { not: userId } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { name: true, role: true, skills: true },
    }),
    prisma.joinRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { status: true, post: { select: { title: true } } },
    }),
  ]);

  const person = (u, extra = "") => `${u?.name ?? "Unknown"} (${[u?.role && u.role !== "User" ? u.role : null, extra].filter(Boolean).join(", ") || "member"})`;

  const projectLines = posts.map((p) => {
    const team = [person(p.author, "owner"), ...(p.joinRequests ?? []).map((r) => person(r.user))].join(", ");
    const mine = p.authorId === userId ? " (the current user's project)" : "";
    return `- "${p.title}"${mine} [${p.domain}]; needs: ${p.skills.join(", ") || "n/a"}; team: ${team}; ${p.description.slice(0, 200)}`;
  });
  const requestLines = myRequests.map((r) => `- "${r.post?.title ?? "Deleted project"}": ${r.status}`);
  const peerLines = peers.map((u) => `- ${u.name} (${u.role}); skills: ${u.skills.join(", ") || "n/a"}`);

  return [
    `Current user: ${me?.name ?? "Unknown"} (${me?.role ?? "User"}); skills: ${me?.skills?.join(", ") || "none listed"}`,
    `Open projects (newest first):\n${projectLines.join("\n") || "(none yet)"}`,
    `People on the platform:\n${peerLines.join("\n") || "(none yet)"}`,
    `The current user's join requests:\n${requestLines.join("\n") || "(none)"}`,
  ].join("\n\n");
};

// POST /api/ai/chat  { messages: [{ role, content }] } -> streams plain text
export const chat = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: "The AI assistant isn't configured on this server yet." });
  }
  if (isRateLimited(req.user.id)) {
    return res.status(429).json({ message: "You're sending messages quickly. Give it a few minutes and try again." });
  }

  const error = validateMessages(req.body?.messages);
  if (error) return res.status(400).json({ message: error });

  const messages = req.body.messages.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content }));
  if (messages[0].role !== "user") messages.shift(); // trimmed history must still start with the user

  let context;
  try {
    context = await buildPlatformContext(req.user.id);
  } catch (err) {
    console.error("AI context error:", err);
    return res.status(500).json({ message: "Couldn't load platform data for the assistant." });
  }

  // Gemini uses "model" for the assistant role and wraps text in parts.
  const contents = messages.map(({ role, content }) => ({
    role: role === "assistant" ? "model" : "user",
    parts: [{ text: content }],
  }));

  // Stop generating if the user closes the chat mid-answer.
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) abort.abort();
  });

  try {
    const stream = await getClient().models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\nPlatform data:\n\n${context}`,
        maxOutputTokens: 2048,
        abortSignal: abort.signal,
      },
    });

    let finishReason;
    for await (const chunk of stream) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("X-Accel-Buffering", "no");
      }
      const text = chunk.text;
      if (text) res.write(text);
      finishReason = chunk.candidates?.[0]?.finishReason ?? finishReason;
    }

    if (!res.headersSent) res.setHeader("Content-Type", "text/plain; charset=utf-8");
    if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT" || finishReason === "BLOCKLIST") {
      res.write("\n\nSorry, I can't help with that one. Try asking another way.");
    } else if (finishReason === "MAX_TOKENS") {
      res.write("\n\n(Reply cut short. Ask me to continue.)");
    }
    res.end();
  } catch (err) {
    if (abort.signal.aborted) return; // client went away
    console.error("AI chat error:", err);
    let status = 502;
    let message = "Something went wrong talking to the assistant. Please try again.";
    if (err instanceof ApiError) {
      if (err.status === 429) {
        status = 429;
        message = "Verse has hit its free usage limit for now. Try again in a little while.";
      } else if (err.status === 400 || err.status === 401 || err.status === 403) {
        message = "The assistant's API key or model isn't set up correctly. Ask the site admin to check it.";
      }
    }
    if (!res.headersSent) res.status(status).json({ message });
    else res.end(`\n\n⚠️ ${message}`);
  }
};
