import type { AuthPrincipal } from "../modules/auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPrincipal;
    }
  }
}

export {};
