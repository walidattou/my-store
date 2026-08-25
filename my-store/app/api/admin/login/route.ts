import { NextResponse } from "next/server";
import { createSessionValue, sessionCookie } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookie(createSessionValue()));
  return response;
}
