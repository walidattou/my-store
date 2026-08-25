import { NextResponse } from "next/server";
import { createSessionValue, sessionCookie } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const { email, password } = await request.json() as { email?: unknown; password?: unknown };
  const submittedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const submittedPassword = typeof password === "string" ? password.trim() : "";
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!configuredEmail || !configuredPassword || submittedEmail !== configuredEmail || submittedPassword !== configuredPassword) return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookie(createSessionValue()));
  return response;
}
