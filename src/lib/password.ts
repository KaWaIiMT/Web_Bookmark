export const runtime = 'nodejs';
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** A dummy hash for timing-attack mitigation when the user doesn't exist */
const DUMMY_HASH =
  "$2a$12$LJ3m4ys3Lk0TSwHCpNqrYeLz5jOFYhHxGX6d7dGCqLvqTQQhqHqGq";

export async function verifyPasswordSafe(
  password: string,
  hash: string | null
): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
