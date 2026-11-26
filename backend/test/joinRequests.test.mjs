import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// In-memory stand-in for the Prisma client, covering only what the controller uses.
const db = { posts: [], requests: [] };
let nextId = 1;
const oid = () => String(nextId++).padStart(24, "0");
const users = {
  owner: { id: "a".repeat(24), name: "Owner", role: "Designer", skills: ["Figma"] },
  alice: { id: "b".repeat(24), name: "Alice", role: "Developer", skills: ["React"] },
  bob: { id: "c".repeat(24), name: "Bob", role: "Manager", skills: [] },
};
const userById = (id) => Object.values(users).find((u) => u.id === id);
const withUser = (r) => ({ ...r, user: userById(r.userId) });
const matches = (r, where) =>
  Object.entries(where).every(([k, v]) => (k === "OR" ? v.some((w) => matches(r, w)) : r[k] === v));

const fakePrisma = {
  post: {
    findUnique: async ({ where }) => {
      const p = db.posts.find((x) => x.id === where.id);
      return p && { ...p, author: userById(p.authorId) };
    },
  },
  joinRequest: {
    findMany: async ({ where }) => db.requests.filter((r) => matches(r, where)).map(withUser),
    findUnique: async ({ where, include }) => {
      const r = where.userId_postId
        ? db.requests.find((x) => x.userId === where.userId_postId.userId && x.postId === where.userId_postId.postId)
        : db.requests.find((x) => x.id === where.id);
      if (!r) return null;
      return include?.post ? { ...r, post: db.posts.find((p) => p.id === r.postId) } : r;
    },
    create: async ({ data }) => {
      const r = { id: oid(), status: "Pending", ...data };
      db.requests.push(r);
      return withUser(r);
    },
    update: async ({ where, data }) => {
      const r = db.requests.find((x) => x.id === where.id);
      Object.assign(r, data);
      return withUser(r);
    },
    delete: async ({ where }) => {
      db.requests = db.requests.filter((x) => x.id !== where.id);
    },
  },
};

mock.module("../src/utils/prisma.js", { defaultExport: fakePrisma });
const { getJoinRequests, createJoinRequest, respondToJoinRequest, withdrawJoinRequest } = await import(
  "../src/controllers/joinRequestController.js"
);

// Calls a controller like Express would and returns { status, body }.
const call = async (handler, { user, params = {}, body = {} }) => {
  let status = 200;
  let payload;
  const res = {
    status(code) { status = code; return this; },
    json(data) { payload = data; return this; },
  };
  await handler({ user: user && { id: user.id }, params, body }, res);
  return { status, body: payload };
};

let postId;
beforeEach(() => {
  db.posts = [];
  db.requests = [];
  postId = oid();
  db.posts.push({ id: postId, authorId: users.owner.id, status: "Open" });
});

test("anyone can ask once; owner, closed projects and duplicates are refused", async () => {
  const ok = await call(createJoinRequest, { user: users.alice, params: { id: postId }, body: { message: "  Hi!  " } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.message, "Hi!");
  assert.equal(ok.body.status, "Pending");

  assert.equal((await call(createJoinRequest, { user: users.alice, params: { id: postId } })).status, 409);
  assert.equal((await call(createJoinRequest, { user: users.owner, params: { id: postId } })).status, 400);
  assert.equal((await call(createJoinRequest, { user: users.bob, params: { id: postId }, body: { message: "x".repeat(501) } })).status, 400);
  assert.equal((await call(createJoinRequest, { user: users.bob, params: { id: "nope" } })).status, 400);

  db.posts[0].status = "Closed";
  const closed = await call(createJoinRequest, { user: users.bob, params: { id: postId } });
  assert.equal(closed.status, 400);
  assert.match(closed.body.message, /isn't taking new members/);
});

test("only the owner sees all requests; others see the team and their own", async () => {
  await call(createJoinRequest, { user: users.alice, params: { id: postId } });
  await call(createJoinRequest, { user: users.bob, params: { id: postId } });

  const owner = await call(getJoinRequests, { user: users.owner, params: { id: postId } });
  assert.equal(owner.body.isOwner, true);
  assert.equal(owner.body.requests.length, 2);

  const alice = await call(getJoinRequests, { user: users.alice, params: { id: postId } });
  assert.equal(alice.body.isOwner, false);
  assert.deepEqual(alice.body.requests, []);
  assert.equal(alice.body.mine.userId, users.alice.id);
  assert.deepEqual(alice.body.team.map((u) => u.name), ["Owner"]);

  const anon = await call(getJoinRequests, { params: { id: postId } });
  assert.equal(anon.body.mine, null);
  assert.deepEqual(anon.body.requests, []);
});

test("owner accepts or declines once; accepted members join the team", async () => {
  const { body: req } = await call(createJoinRequest, { user: users.alice, params: { id: postId } });

  assert.equal((await call(respondToJoinRequest, { user: users.alice, params: { id: req.id }, body: { status: "Accepted" } })).status, 403);
  assert.equal((await call(respondToJoinRequest, { user: users.owner, params: { id: req.id }, body: { status: "Maybe" } })).status, 400);

  const accepted = await call(respondToJoinRequest, { user: users.owner, params: { id: req.id }, body: { status: "Accepted" } });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.status, "Accepted");
  assert.equal((await call(respondToJoinRequest, { user: users.owner, params: { id: req.id }, body: { status: "Declined" } })).status, 409);

  const bob = await call(getJoinRequests, { user: users.bob, params: { id: postId } });
  assert.deepEqual(bob.body.team.map((u) => u.name), ["Owner", "Alice"]);
});

test("only the requester can withdraw, and only while pending", async () => {
  const { body: req } = await call(createJoinRequest, { user: users.alice, params: { id: postId } });
  assert.equal((await call(withdrawJoinRequest, { user: users.bob, params: { id: req.id } })).status, 403);
  assert.equal((await call(withdrawJoinRequest, { user: users.alice, params: { id: req.id } })).status, 200);
  assert.equal(db.requests.length, 0);

  const { body: again } = await call(createJoinRequest, { user: users.alice, params: { id: postId } });
  await call(respondToJoinRequest, { user: users.owner, params: { id: again.id }, body: { status: "Declined" } });
  assert.equal((await call(withdrawJoinRequest, { user: users.alice, params: { id: again.id } })).status, 409);
});
