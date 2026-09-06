import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app";
import { createMemoryAuthStore } from "../src/modules/auth/auth.store.memory";
import { createMemoryGoalStore } from "../src/modules/goals/goal.store.memory";

const previousCost = process.env.BCRYPT_COST;

before(() => {
  process.env.BCRYPT_COST = "4";
});

after(() => {
  if (previousCost === undefined) {
    delete process.env.BCRYPT_COST;
  } else {
    process.env.BCRYPT_COST = previousCost;
  }
});

function app() {
  return createApp({
    authStore: createMemoryAuthStore(),
    goalStore: createMemoryGoalStore(),
  });
}

async function registerAndLogin(
  server: ReturnType<typeof request.agent>,
  email: string,
) {
  const password = "password12";
  const registered = await server
    .post("/api/auth/register")
    .send({ email, password });
  assert.equal(registered.status, 201);
  const login = await server.post("/api/auth/login").send({ email, password });
  assert.equal(login.status, 200);
  return registered.body.user.id as string;
}

test("unauthenticated goal routes are rejected", async () => {
  const agent = request.agent(app());
  const list = await agent.get("/api/goals");
  assert.equal(list.status, 401);

  const created = await agent.post("/api/goals").send({
    title: "Prep",
    category: "STUDY",
  });
  assert.equal(created.status, 401);
});

test("create, list, get, patch, delete own goals", async () => {
  const agent = request.agent(app());
  await registerAndLogin(agent, `owner-${Date.now()}@surfguard.test`);

  const created = await agent.post("/api/goals").send({
    title: "Interview prep",
    description: "LeetCode and system design",
    category: "INTERVIEW_PREP",
    topics: ["Algorithms", "Databases"],
    keywords: ["LeetCode"],
    isActive: true,
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.goal.title, "Interview prep");
  assert.equal(created.body.goal.category, "INTERVIEW_PREP");
  assert.deepEqual(created.body.goal.topics, ["algorithms", "databases"]);
  assert.deepEqual(created.body.goal.keywords, ["leetcode"]);
  assert.equal(created.body.goal.isActive, true);
  assert.equal(created.body.goal.userId, undefined);

  const id = created.body.goal.id as string;

  const list = await agent.get("/api/goals");
  assert.equal(list.status, 200);
  assert.equal(list.body.goals.length, 1);
  assert.equal(list.body.goals[0].id, id);

  const got = await agent.get(`/api/goals/${id}`);
  assert.equal(got.status, 200);
  assert.equal(got.body.goal.description, "LeetCode and system design");

  const patched = await agent.patch(`/api/goals/${id}`).send({
    title: "Interview prep v2",
    isActive: false,
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.goal.title, "Interview prep v2");
  assert.equal(patched.body.goal.isActive, false);

  const removed = await agent.delete(`/api/goals/${id}`);
  assert.equal(removed.status, 204);

  const missing = await agent.get(`/api/goals/${id}`);
  assert.equal(missing.status, 404);
  assert.equal(missing.body.code, "GOAL_NOT_FOUND");
});

test("users cannot access another user's goals", async () => {
  const server = app();
  const owner = request.agent(server);
  const other = request.agent(server);

  await registerAndLogin(owner, `owner-${Date.now()}@surfguard.test`);
  await registerAndLogin(other, `other-${Date.now()}@surfguard.test`);

  const created = await owner.post("/api/goals").send({
    title: "Private goal",
    category: "WORK",
  });
  assert.equal(created.status, 201);
  const id = created.body.goal.id as string;

  const listed = await other.get("/api/goals");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.goals.length, 0);

  const got = await other.get(`/api/goals/${id}`);
  assert.equal(got.status, 404);

  const patched = await other.patch(`/api/goals/${id}`).send({ title: "Hacked" });
  assert.equal(patched.status, 404);

  const removed = await other.delete(`/api/goals/${id}`);
  assert.equal(removed.status, 404);

  const stillThere = await owner.get(`/api/goals/${id}`);
  assert.equal(stillThere.status, 200);
  assert.equal(stillThere.body.goal.title, "Private goal");
});

test("goal validation rejects empty title and unknown category", async () => {
  const agent = request.agent(app());
  await registerAndLogin(agent, `valid-${Date.now()}@surfguard.test`);

  const emptyTitle = await agent.post("/api/goals").send({
    title: "  ",
    category: "STUDY",
  });
  assert.equal(emptyTitle.status, 400);
  assert.equal(emptyTitle.body.code, "VALIDATION_ERROR");

  const badCategory = await agent.post("/api/goals").send({
    title: "Valid title",
    category: "NOT_A_CATEGORY",
  });
  assert.equal(badCategory.status, 400);

  const emptyPatch = await agent
    .post("/api/goals")
    .send({ title: "Keep", category: "GENERAL" })
    .then((created) =>
      agent.patch(`/api/goals/${created.body.goal.id as string}`).send({}),
    );
  assert.equal(emptyPatch.status, 400);
});
