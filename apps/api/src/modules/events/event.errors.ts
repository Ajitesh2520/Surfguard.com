import { HttpError } from "../../http-error";

export class EventError extends HttpError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "EventError";
  }

  static validation(message = "Invalid request"): EventError {
    return new EventError(400, "VALIDATION_ERROR", message);
  }
}
