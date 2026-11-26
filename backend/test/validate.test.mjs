import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePostInput as v, cleanSkills } from "../src/utils/validate.js";
test("validatePostInput and cleanSkills", () => {
const ok = { title: "  App  ", description: "Desc", domain: "Web", skills: [" React ", "React", "", "Node"] };
assert.deepEqual(v(ok).data, { title: "App", description: "Desc", domain: "Web", skills: ["React", "Node"] });
assert.match(v({ ...ok, title: "   " }).error, /Title is required/);
assert.match(v({ ...ok, title: 42 }).error, /Title is required/);
assert.match(v({ ...ok, title: "x".repeat(121) }).error, /120/);
assert.match(v({ ...ok, description: "x".repeat(3001) }).error, /3000/);
assert.match(v({ ...ok, domain: "Crypto" }).error, /Domain must be/);
assert.match(v({ ...ok, skills: "React" }).error, /list/);
assert.match(v({ ...ok, skills: ["x".repeat(31)] }).error, /30/);
assert.deepEqual(v({ title: "a", description: "b", domain: "AI" }).data.skills, []);
// partial updates
assert.deepEqual(v({ status: "Closed" }, { partial: true }).data, { status: "Closed" });
assert.match(v({ status: "Done" }, { partial: true }).error, /Status/);
assert.match(v({ title: "" }, { partial: true }).error, /Title is required/);
assert.match(v({}, { partial: true }).error, /Nothing to update/);
assert.equal(cleanSkills(Array(30).fill(0).map((_, i) => "s" + i)).skills.length, 20);
});
