export class AuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }

  static validation(message = "Invalid request"): AuthError {
    return new AuthError(400, "VALIDATION_ERROR", message);
  }

  static emailTaken(): AuthError {
    return new AuthError(409, "EMAIL_TAKEN", "Email is already registered");
  }

  static invalidCredentials(): AuthError {
    return new AuthError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  static unauthorized(): AuthError {
    return new AuthError(401, "UNAUTHORIZED", "Authentication required");
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
