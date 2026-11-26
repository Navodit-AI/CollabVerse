import { test, mock } from "node:test";
import assert from "node:assert/strict";

const ME = "a".repeat(24);
let lastRequestQuery;

const fakePrisma = {
  user: {
    findUnique: async () => ({ name: "Navodit", role: "Developer", skills: ["React"] }),
    findMany: async () => [{ name: "Maya", role: "Designer", skills: ["Figma"] }],
  },
  post: {
    findMany: async () => [
      {
        title: "Campus lost & found",
        description: "Find lost things.",
        domain: "Web",
        skills: ["React", "Node"],
        authorId: "b".repeat(24),
        author: { name: "Maya", role: "Designer" },
        joinRequests: [{ user: { name: "Arjun", role: "Developer" } }],
      },
      {
        title: "Notes AI",
        description: "Summarise lectures.",
        domain: "AI",
        skills: ["Python"],
        authorId: ME,
        author: { name: "Navodit", role: "User" },
        joinRequests: [],
      },
    ],
  },
  joinRequest: {
    findMany: async (args) => {
      lastRequestQuery = args;
      return [{ status: "Pending", post: { title: "Pixel dungeon jam" } }];
    },
  },
};

mock.module("../src/utils/prisma.js", { defaultExport: fakePrisma });
const { buildPlatformContext } = await import("../src/controllers/aiController.js");

test("Verse's snapshot includes teams, the user's own projects and their requests", async () => {
  const ctx = await buildPlatformContext(ME);

  assert.match(ctx, /"Campus lost & found" \[Web\]; needs: React, Node; team: Maya \(Designer, owner\), Arjun \(Developer\);/);
  assert.match(ctx, /"Notes AI" \(the current user's project\) \[AI\]; .* team: Navodit \(owner\);/);
  assert.match(ctx, /The current user's join requests:\n- "Pixel dungeon jam": Pending/);
  assert.deepEqual(lastRequestQuery.where, { userId: ME }, "only the current user's requests are loaded");
});
