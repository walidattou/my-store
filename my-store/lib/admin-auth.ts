import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "store_admin_session";
const sessionDuration = 60 * 60 * 8;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters");
  return value;
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionValue() {
  const expires = Math.floor(Date.now() / 1000) + sessionDuration;
  const payload = `admin:${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function isValidSession(value?: string) {
  if (!value) return false;
  const [payload, provided] = value.split(".");
  if (!payload || !provided || Number(payload.split(":")[1]) < Math.floor(Date.now() / 1000)) return false;
  const expected = signature(payload);
  return provided.length === expected.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function isAdmin() {
  return isValidSession((await cookies()).get(cookieName)?.value);
}

export function sessionCookie(value: string) {
  return { name: cookieName, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: sessionDuration };
}

export { cookieName };
