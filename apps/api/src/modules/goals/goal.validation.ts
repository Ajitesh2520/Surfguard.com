import type { NextFunction, Request, Response } from "express";
import { GOAL_CATEGORIES, type GoalCategory } from "@surfguard/shared";
import { z } from "zod";
import { GoalError } from "./goal.errors";

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .transform((value) => value.toLowerCase());

const goalCategorySchema = z.enum(
  GOAL_CATEGORIES as unknown as [GoalCategory, ...GoalCategory[]],
);

export const createGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : null)),
  category: goalCategorySchema,
  topics: z.array(tagSchema).max(20).default([]),
  keywords: z.array(tagSchema).max(30).default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        return value ? value : null;
      }),
    category: goalCategorySchema.optional(),
    topics: z.array(tagSchema).max(20).optional(),
    keywords: z.array(tagSchema).max(30).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      next(GoalError.validation(message));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export const validateCreateGoal = validate(createGoalSchema);
export const validateUpdateGoal = validate(updateGoalSchema);
