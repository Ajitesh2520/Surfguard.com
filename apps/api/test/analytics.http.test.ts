import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app";
import { createMemoryAuthStore } from "../src/modules/auth/auth.store.memory";
import { createMemoryClassificationCache } from "../src/modules/classification/classification.cache.memory";
import { createMemoryClassificationStore } from "../src/modules/classification/classification.store.memory";
import { createMockClassifier } from "../src/modules/classification/classifier.mock";
import { createMemoryEventStore } from "../src/modules/events/event.store.memory";
import { createMemoryGoalStore } from "../src/modules/goals/goal.store.memory";
import { createMemorySessionStore } from "../src/modules/sessions/session.store.memory";

const previousCost = process.env.BCRYPT_COST;
const previousLimit = process.env.EVENTS_RATE_LIMIT;

before(() => {
  process.env.BCRYPT_COST = "4";
  process.env.EVENTS_RATE_LIMIT = "40";
});

after(() => {
  if (previousCost === undefined) {
    delete process.env.BCRYPT_COST;
  } else {
    process.env.BCRYPT_COST = previousCost;
  }
  if (previousLimit === undefined) {
    delete process.env.EVENTS_RATE_LIMIT;
  } else {
    process.env.EVENTS_RATE_LIMIT = previousLimit;
  }
});

function app() {
  return createApp({
    authStore: createMemoryAuthStore(),
    goalStore: createMemoryGoalStore(),
    sessionStore: createMemorySessionStore(),
    eventStore: createMemoryEventStore(),
    classifier: createMockClassifier(),
    classificationCache: createMemoryClassificationCache(),
    classificationStore: createMemoryClassificationStore(),
  });
}

async function loginAgent(
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

test("unauthenticated analytics is rejected", async () => {
  const agent = request.agent(app());
  const response = await agent.get("/api/analytics");
  assert.equal(response.status, 401);
});

test("rejects invalid days and returns empty overview", async () => {
  const agent = request.agent(app());
  await loginAgent(agent, `empty-${Date.now()}@surfguard.test`);

  const invalid = await agent.get("/api/analytics?days=0");
  assert.equal(invalid.status, 400);

  const empty = await agent.get("/api/analytics");
  assert.equal(empty.status, 200);
  assert.equal(empty.body.rangeDays, 7);
  assert.equal(empty.body.overview.focusTimeMs, 0);
  assert.equal(empty.body.overview.productiveTimeMs, 0);
  assert.equal(empty.body.overview.completedSessions, 0);
  assert.deepEqual(empty.body.sessions, []);
  assert.deepEqual(empty.body.timeline, []);
});

test("aggregates focus, productivity, interventions, and sessions", async () => {
  const agent = request.agent(app());
  await loginAgent(agent, `metrics-${Date.now()}@surfguard.test`);

  const goal = await agent.post("/api/goals").send({
    title: "Ship the API",
    category: "CODING",
  });
  assert.equal(goal.status, 201);

  const started = await agent.post("/api/sessions").send({
    goalId: goal.body.goal.id,
    durationMinutes: 25,
    strictness: "BALANCED",
  });
  assert.equal(started.status, 201);

  const productive = await agent.post("/api/events").send({
    url: "https://github.com/surfguard/app",
    title: "GitHub",
    timestamp: "2026-09-07T10:00:00.000Z",
  });
  assert.equal(productive.status, 201);
  assert.equal(productive.body.intervention.decision, "ALLOW");

  const distracted = await agent.post("/api/events").send({
    url: "https://instagram.com/",
    title: "Instagram",
    timestamp: "2026-09-07T10:02:00.000Z",
  });
  assert.equal(distracted.status, 201);
  assert.equal(distracted.body.intervention.decision, "WARN");

  const switched = await agent.post("/api/events").send({
    url: "https://github.com/surfguard/app",
    title: "GitHub",
    timestamp: "2026-09-07T10:03:00.000Z",
  });
  assert.equal(switched.status, 201);

  const stopped = await agent.post(
    `/api/sessions/${started.body.session.id}/stop`,
  );
  assert.equal(stopped.status, 200);

  const analytics = await agent.get("/api/analytics?days=7");
  assert.equal(analytics.status, 200);
  const overview = analytics.body.overview;
  assert.equal(overview.completedSessions, 1);
  assert.ok(overview.focusTimeMs >= 0);
  assert.equal(overview.productiveTimeMs, 120_000);
  assert.equal(overview.distractedTimeMs, 60_000);
  assert.equal(overview.interventions, 1);
  assert.equal(overview.nudges, 0);
  assert.equal(overview.blockedAttempts, 0);
  assert.equal(overview.contextSwitches, 2);
  assert.ok(overview.averageDriftScore >= 0);

  assert.equal(analytics.body.sessions.length, 1);
  assert.equal(analytics.body.sessions[0].goalTitle, "Ship the API");
  assert.ok(analytics.body.timeline.length >= 3);
  assert.ok(
    analytics.body.goals.some(
      (row: { title: string; completedSessions: number }) =>
        row.title === "Ship the API" && row.completedSessions === 1,
    ),
  );
  assert.ok(
    analytics.body.distractions.some(
      (row: { domain: string }) => row.domain === "instagram.com",
    ),
  );
  assert.equal(analytics.body.interventions.length, 1);
  assert.equal(analytics.body.interventions[0].kind, "WARN");
  assert.equal(analytics.body.interventions[0].domain, "instagram.com");

  const cached = await agent.get("/api/analytics?days=7");
  assert.equal(cached.status, 200);
  assert.deepEqual(cached.body.overview, overview);
});

test("does not leak analytics across users", async () => {
  const server = app();
  const owner = request.agent(server);
  const other = request.agent(server);
  await loginAgent(owner, `owner-${Date.now()}@surfguard.test`);
  await loginAgent(other, `other-${Date.now()}@surfguard.test`);

  const goal = await owner.post("/api/goals").send({
    title: "Work",
    category: "WORK",
  });
  await owner.post("/api/sessions").send({
    goalId: goal.body.goal.id,
    durationMinutes: 25,
    strictness: "STRICT",
  });
  await owner.post("/api/events").send({
    url: "https://instagram.com/",
    timestamp: "2026-09-07T12:00:00.000Z",
  });

  const ownerStats = await owner.get("/api/analytics");
  const otherStats = await other.get("/api/analytics");
  assert.equal(ownerStats.body.overview.blockedAttempts, 1);
  assert.equal(otherStats.body.overview.blockedAttempts, 0);
  assert.equal(otherStats.body.interventions.length, 0);
});
