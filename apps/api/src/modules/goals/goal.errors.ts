import { HttpError } from "../../http-error";

export class GoalError extends HttpError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "GoalError";
  }

  static validation(message = "Invalid request"): GoalError {
    return new GoalError(400, "VALIDATION_ERROR", message);
  }

  static notFound(): GoalError {
    return new GoalError(404, "GOAL_NOT_FOUND", "Goal not found");
  }

  static inUse(): GoalError {
    return new GoalError(
      409,
      "GOAL_IN_USE",
      "Goal cannot be deleted while it is referenced",
    );
  }
}
