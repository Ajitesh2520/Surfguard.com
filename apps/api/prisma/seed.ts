import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash("dev-password-change-me", 10);

  const user = await prisma.user.upsert({
    where: { email: "dev@surfguard.local" },
    update: { passwordHash },
    create: {
      email: "dev@surfguard.local",
      passwordHash,
      preference: {
        create: {
          defaultStrictness: "BALANCED",
          timezone: "UTC",
        },
      },
    },
  });

  const goal = await prisma.goal.upsert({
    where: { id: "seed-goal-interview-prep" },
    update: {},
    create: {
      id: "seed-goal-interview-prep",
      userId: user.id,
      title: "Prepare for interviews",
      description: "Seed goal for local development",
      category: "INTERVIEW_PREP",
    },
  });

  const session = await prisma.focusSession.upsert({
    where: { id: "seed-session-1" },
    update: {},
    create: {
      id: "seed-session-1",
      userId: user.id,
      goalId: goal.id,
      strictness: "BALANCED",
      status: "ENDED",
      startedAt: new Date("2026-01-01T10:00:00.000Z"),
      endedAt: new Date("2026-01-01T11:00:00.000Z"),
    },
  });

  const event = await prisma.browsingEvent.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      userId: user.id,
      focusSessionId: session.id,
      url: "https://leetcode.com/problemset/",
      domain: "leetcode.com",
      title: "Problem List - LeetCode",
      occurredAt: new Date("2026-01-01T10:15:00.000Z"),
      classification: {
        create: {
          decision: "ALLOW",
          relevant: true,
          confidence: 1,
          source: "RULE",
          reason: "Seed classification",
        },
      },
    },
  });

  await prisma.intervention.upsert({
    where: { id: "seed-intervention-1" },
    update: {},
    create: {
      id: "seed-intervention-1",
      userId: user.id,
      focusSessionId: session.id,
      browsingEventId: event.id,
      kind: "NUDGE",
      message: "Seed intervention",
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
