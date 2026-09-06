import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app";
import { createMemoryAuthStore } from "../src/modules/auth/auth.store.memory";

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

test("register → login → /me → logout → /me rejected", async () => {
  const app = createApp({ authStore: createMemoryAuthStore() });
  const agent = request.agent(app);
  const email = `user-${Date.now()}@surfguard.test`;
  const password = "password12";

  const registered = await agent
    .post("/api/auth/register")
    .send({ email, password });

  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.email, email);
  assert.equal(registered.body.user.password, undefined);
  assert.equal(registered.body.user.passwordHash, undefined);

  const login = await agent.post("/api/auth/login").send({ email, password });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, email);
  assert.equal(login.body.user.passwordHash, undefined);
  assert.equal(typeof login.body.token, "string");
  assert.match(String(login.headers["set-cookie"]), /surfguard_session=/);

  const me = await agent.get("/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, email);
  assert.equal(me.body.user.id, registered.body.user.id);
  assert.equal(me.body.user.passwordHash, undefined);

  const logout = await agent.post("/api/auth/logout");
  assert.equal(logout.status, 204);

  const meAfterLogout = await agent.get("/api/auth/me");
  assert.equal(meAfterLogout.status, 401);
  assert.equal(meAfterLogout.body.code, "UNAUTHORIZED");
});
