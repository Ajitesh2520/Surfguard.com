import bcrypt from "bcryptjs";
import { PrismaClient, SessionStatus, SessionStrictness } from "@prisma/client";

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
      topics: ["algorithms", "system design"],
      keywords: ["leetcode", "interview"],
    },
  });

  const session = await prisma.focusSession.upsert({
    where: { id: "seed-session-1" },
    update: {},
    create: {
      id: "seed-session-1",
      userId: user.id,
      goalId: goal.id,
      strictness: SessionStrictness.BALANCED,
      status: SessionStatus.COMPLETED,
      startTime: new Date("2026-01-01T10:00:00.000Z"),
      endTime: new Date("2026-01-01T11:00:00.000Z"),
      durationMs: 60 * 60 * 1000,
      plannedDurationMinutes: 60,
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
