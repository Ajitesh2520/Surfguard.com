import { HttpError } from "../../http-error";

export class SessionError extends HttpError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "SessionError";
  }

  static validation(message = "Invalid request"): SessionError {
    return new SessionError(400, "VALIDATION_ERROR", message);
  }

  static notFound(): SessionError {
    return new SessionError(404, "SESSION_NOT_FOUND", "Session not found");
  }

  static alreadyActive(): SessionError {
    return new SessionError(
      409,
      "SESSION_ALREADY_ACTIVE",
      "An active focus session already exists",
    );
  }

  static invalidTransition(): SessionError {
    return new SessionError(
      409,
      "INVALID_SESSION_TRANSITION",
      "This session cannot be stopped",
    );
  }
}
