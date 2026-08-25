import { NextResponse } from "next/server";
import { getSheet } from "../../../lib/sheets";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (typeof data.name !== "string" || typeof data.phone !== "string" || !data.name.trim() || !data.phone.trim()) {
      return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
    }

    const sheet = await getSheet();
    await sheet.addRow({ Name: data.name.trim(), Phone: data.phone.trim() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    return NextResponse.json({ error: "Unable to submit the form." }, { status: 500 });
  }
}