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
  process.env.EVENTS_RATE_LIMIT = "20";
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

async function loginAgent(server: ReturnType<typeof request.agent>, email: string) {
  const password = "password12";
  const registered = await server
    .post("/api/auth/register")
    .send({ email, password });
  assert.equal(registered.status, 201);
  const login = await server.post("/api/auth/login").send({ email, password });
  assert.equal(login.status, 200);
  return login.body.token as string;
}

test("unauthenticated event ingest is rejected", async () => {
  const agent = request.agent(app());
  const created = await agent.post("/api/events").send({
    url: "https://example.com/path",
  });
  assert.equal(created.status, 401);
});

test("persists events without an active session", async () => {
  const agent = request.agent(app());
  await loginAgent(agent, `evt-${Date.now()}@surfguard.test`);

  const created = await agent.post("/api/events").send({
    url: "https://WWW.Example.com/path/?utm_source=x#hash",
    title: "Example",
    tabId: 12,
    timestamp: "2026-01-02T10:00:00.000Z",
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.event.domain, "example.com");
  assert.equal(created.body.event.url, "https://example.com/path");
  assert.equal(created.body.event.focusSessionId, null);
  assert.equal(created.body.event.tabId, 12);
  assert.equal(created.body.event.title, "Example");

  const list = await agent.get("/api/events");
  assert.equal(list.status, 200);
  assert.equal(list.body.events.length, 1);
  assert.equal(list.body.events[0].id, created.body.event.id);
});

test("attaches the active focus session and accepts bearer auth", async () => {
  const server = app();
  const agent = request.agent(server);
  const token = await loginAgent(agent, `sess-${Date.now()}@surfguard.test`);

  const goal = await agent.post("/api/goals").send({
    title: "Work",
    category: "WORK",
  });
  const started = await agent.post("/api/sessions").send({
    goalId: goal.body.goal.id,
    durationMinutes: 25,
  });
  assert.equal(started.status, 201);

  const created = await request(server)
    .post("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .send({ url: "https://github.com/explore" });

  assert.equal(created.status, 201);
  assert.equal(created.body.event.domain, "github.com");
  assert.equal(created.body.event.focusSessionId, started.body.session.id);
});

test("rate limits event ingest", async () => {
  process.env.EVENTS_RATE_LIMIT = "2";
  const agent = request.agent(app());
  await loginAgent(agent, `limit-${Date.now()}@surfguard.test`);

  const first = await agent.post("/api/events").send({ url: "https://a.example/" });
  const second = await agent.post("/api/events").send({ url: "https://b.example/" });
  const third = await agent.post("/api/events").send({ url: "https://c.example/" });

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(third.status, 429);
  process.env.EVENTS_RATE_LIMIT = "20";
});

test("rejects invalid urls and other users' events", async () => {
  const server = app();
  const owner = request.agent(server);
  const other = request.agent(server);
  await loginAgent(owner, `owner-${Date.now()}@surfguard.test`);
  await loginAgent(other, `other-${Date.now()}@surfguard.test`);

  const invalid = await owner.post("/api/events").send({ url: "chrome://settings" });
  assert.equal(invalid.status, 400);

  await owner.post("/api/events").send({ url: "https://owner.example/" });
  const listed = await other.get("/api/events");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.events.length, 0);
});
