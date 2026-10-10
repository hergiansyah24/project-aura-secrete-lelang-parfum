import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "./db";

const jwtSecretValue = process.env.JWT_SECRET;

if (!jwtSecretValue || jwtSecretValue.length < 32) {
  throw new Error(
    "JWT_SECRET wajib diatur dan minimal 32 karakter."
  );
}

const JWT_SECRET = new TextEncoder().encode(jwtSecretValue);

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "bidder";
  isFlagged: boolean;
  flagReason?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: {
  userId: number;
  username: string;
  email: string;
  role: "admin" | "bidder";
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{
  userId: number;
  username: string;
  email: string;
  role: "admin" | "bidder";
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as "admin" | "bidder",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sealed_bid_session")?.value;
    if (!token) return null;

    const verified = await verifySessionToken(token);
    if (!verified) return null;

    const db = getDb();
    const user = db
      .prepare("SELECT id, username, email, role, is_flagged, flag_reason FROM users WHERE id = ?")
      .get(verified.userId) as
      | {
          id: number;
          username: string;
          email: string;
          role: string;
          is_flagged: number;
          flag_reason: string | null;
        }
      | undefined;

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as "admin" | "bidder",
      isFlagged: Boolean(user.is_flagged),
      flagReason: user.flag_reason,
    };
  } catch {
    return null;
  }
}

