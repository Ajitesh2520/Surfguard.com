import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app";
import { createMemoryAuthStore } from "../src/modules/auth/auth.store.memory";
import { createMemoryGoalStore } from "../src/modules/goals/goal.store.memory";
import { createMemorySessionStore } from "../src/modules/sessions/session.store.memory";

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
    sessionStore: createMemorySessionStore(),
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
}

async function createGoal(server: ReturnType<typeof request.agent>) {
  const created = await server.post("/api/goals").send({
    title: "Deep work",
    category: "WORK",
  });
  assert.equal(created.status, 201);
  return created.body.goal.id as string;
}

test("unauthenticated session routes are rejected", async () => {
  const agent = request.agent(app());
  const list = await agent.get("/api/sessions");
  assert.equal(list.status, 401);
});

test("start, list, get, and stop a focus session", async () => {
  const agent = request.agent(app());
  await registerAndLogin(agent, `sess-${Date.now()}@surfguard.test`);
  const goalId = await createGoal(agent);

  const started = await agent.post("/api/sessions").send({
    goalId,
    durationMinutes: 25,
    strictness: "STRICT",
  });
  assert.equal(started.status, 201);
  assert.equal(started.body.session.goalId, goalId);
  assert.equal(started.body.session.status, "ACTIVE");
  assert.equal(started.body.session.strictness, "STRICT");
  assert.equal(started.body.session.plannedDurationMinutes, 25);
  assert.equal(started.body.session.endTime, null);
  assert.equal(started.body.session.durationMs, null);

  const id = started.body.session.id as string;

  const listed = await agent.get("/api/sessions");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.sessions.length, 1);
  assert.equal(listed.body.sessions[0].id, id);

  const got = await agent.get(`/api/sessions/${id}`);
  assert.equal(got.status, 200);
  assert.equal(got.body.session.status, "ACTIVE");

  const stopped = await agent.post(`/api/sessions/${id}/stop`);
  assert.equal(stopped.status, 200);
  assert.equal(stopped.body.session.status, "COMPLETED");
  assert.ok(stopped.body.session.endTime);
  assert.ok(stopped.body.session.durationMs >= 0);
  assert.ok(
    new Date(stopped.body.session.endTime).getTime() >=
      new Date(stopped.body.session.startTime).getTime(),
  );
});

test("goal must belong to the user and only one active session is allowed", async () => {
  const server = app();
  const owner = request.agent(server);
  const other = request.agent(server);

  await registerAndLogin(owner, `owner-${Date.now()}@surfguard.test`);
  await registerAndLogin(other, `other-${Date.now()}@surfguard.test`);
  const ownerGoal = await createGoal(owner);

  const stolen = await other.post("/api/sessions").send({
    goalId: ownerGoal,
    durationMinutes: 25,
  });
  assert.equal(stolen.status, 404);

  const first = await owner.post("/api/sessions").send({
    goalId: ownerGoal,
    durationMinutes: 25,
  });
  assert.equal(first.status, 201);

  const second = await owner.post("/api/sessions").send({
    goalId: ownerGoal,
    durationMinutes: 15,
  });
  assert.equal(second.status, 409);
  assert.equal(second.body.code, "SESSION_ALREADY_ACTIVE");
});

test("invalid stop transitions are rejected", async () => {
  const agent = request.agent(app());
  await registerAndLogin(agent, `stop-${Date.now()}@surfguard.test`);
  const goalId = await createGoal(agent);

  const started = await agent.post("/api/sessions").send({
    goalId,
    durationMinutes: 25,
  });
  const id = started.body.session.id as string;

  const firstStop = await agent.post(`/api/sessions/${id}/stop`);
  assert.equal(firstStop.status, 200);
  assert.equal(firstStop.body.session.status, "COMPLETED");

  const secondStop = await agent.post(`/api/sessions/${id}/stop`);
  assert.equal(secondStop.status, 409);
  assert.equal(secondStop.body.code, "INVALID_SESSION_TRANSITION");

  const missing = await agent.post("/api/sessions/does-not-exist/stop");
  assert.equal(missing.status, 404);
});

test("session validation rejects bad duration and missing goal", async () => {
  const agent = request.agent(app());
  await registerAndLogin(agent, `valid-${Date.now()}@surfguard.test`);

  const missingGoal = await agent.post("/api/sessions").send({
    durationMinutes: 25,
  });
  assert.equal(missingGoal.status, 400);

  const badDuration = await agent.post("/api/sessions").send({
    goalId: "goal-1",
    durationMinutes: 0,
  });
  assert.equal(badDuration.status, 400);
});
