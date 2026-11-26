import { test, mock } from "node:test";
import assert from "node:assert/strict";

const ME = "a".repeat(24);
const OTHER = "b".repeat(24);
const rawPosts = [
  { id: "p1", title: "Mine with requests", authorId: ME, likes: [] },
  { id: "p2", title: "Someone else's", authorId: OTHER, likes: [] },
  { id: "p3", title: "Mine, quiet", authorId: ME, likes: [] },
];
let groupByArgs = [];

const fakePrisma = {
  post: {
    findMany: async () => rawPosts.map((p) => ({ ...p })),
    count: async () => rawPosts.length,
  },
  joinRequest: {
    groupBy: async (args) => {
      groupByArgs.push(args);
      return [{ postId: "p1", _count: { _all: 2 } }]; // p3 has none
    },
  },
};

mock.module("../src/utils/prisma.js", { defaultExport: fakePrisma });
const { getPosts } = await import("../src/controllers/postController.js");

const list = async (user) => {
  let body;
  const res = { status() { return this; }, json(d) { body = d; return this; } };
  await getPosts({ user, query: {} }, res);
  return Object.fromEntries(body.data.map((p) => [p.id, p]));
};

test("pending request counts appear only on the viewer's own posts", async () => {
  groupByArgs = [];
  const posts = await list({ id: ME });
  assert.equal(posts.p1.pendingRequests, 2);
  assert.equal(posts.p3.pendingRequests, 0);
  assert.equal("pendingRequests" in posts.p2, false, "other people's counts stay private");
  assert.deepEqual(groupByArgs[0].where, { postId: { in: ["p1", "p3"] }, status: "Pending" });
});

test("logged-out viewers get no counts and no extra query", async () => {
  groupByArgs = [];
  const posts = await list(undefined);
  assert.ok(Object.values(posts).every((p) => !("pendingRequests" in p)));
  assert.equal(groupByArgs.length, 0);
});
