import bcrypt from "bcryptjs";
import { getAuthConfig } from "./auth.config";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, getAuthConfig().bcryptCost);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
