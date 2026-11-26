import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { loginLimiter, signupLimiter } from "../src/middleware/rateLimit.js";

// Throwaway app: fake handlers so we test only the limiter behaviour.
const start = () =>
  new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    app.post("/login", loginLimiter, (req, res) =>
      req.body.password === "right" ? res.json({ ok: true }) : res.status(401).json({ message: "Invalid credentials" })
    );
    app.post("/signup", signupLimiter, (req, res) => res.status(201).json({ ok: true }));
    const server = app.listen(0, () => resolve(server));
  });

const post = (server, path, body) =>
  fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("login: successful logins don't count, the 11th failure is blocked", async () => {
  const server = await start();
  try {
    for (let i = 0; i < 5; i++) assert.equal((await post(server, "/login", { password: "right" })).status, 200);
    for (let i = 0; i < 10; i++) assert.equal((await post(server, "/login", { password: "wrong" })).status, 401);
    const blocked = await post(server, "/login", { password: "wrong" });
    assert.equal(blocked.status, 429);
    assert.match((await blocked.json()).message, /Too many failed login attempts/);
    assert.ok(blocked.headers.get("ratelimit"), "standard RateLimit header present");
  } finally {
    server.close();
  }
});

test("signup: 6th account in an hour is blocked", async () => {
  const server = await start();
  try {
    for (let i = 0; i < 5; i++) assert.equal((await post(server, "/signup", {})).status, 201);
    const blocked = await post(server, "/signup", {});
    assert.equal(blocked.status, 429);
    assert.match((await blocked.json()).message, /Too many accounts/);
  } finally {
    server.close();
  }
});
