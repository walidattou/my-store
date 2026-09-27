import { NextResponse } from "next/server";
import { addRecord } from "../../../lib/store-data";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const requiredFields = ["name", "phone", "wilaya", "commune", "livraison", "color", "product"];
    if (requiredFields.some((field) => typeof data[field] !== "string" || !data[field].trim()) || !Number.isInteger(data.quantity) || data.quantity < 1) {
      return NextResponse.json({ error: "All order fields are required." }, { status: 400 });
    }

    const quantity = data.quantity as number;
    const deliveryPrice = data.livraison.trim() === "À domicile" ? 500 : 300;
    await addRecord("Orders", {
      Id: crypto.randomUUID(),
      Name: data.name.trim(),
      Number: data.phone.trim(),
      Willaya: data.wilaya.trim(),
      Commune: data.commune.trim(),
      Livraison: data.livraison.trim(),
      Color: data.color.trim(),
      Product: data.product.trim(),
      Quantity: quantity,
      Total: data.total ?? deliveryPrice,
      Status: "Pending",
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    });

    const sheetResponse = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        wilaya: data.wilaya.trim(),
        commune: data.commune.trim(),
        product: data.product.trim(),
        variant: data.color.trim(),
        quantity,
        total: data.total ?? deliveryPrice,
        deliveryType: data.livraison.trim(),
      }),
    });

    if (!sheetResponse.ok) {
      throw new Error(`Google Sheet request failed with status ${sheetResponse.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    if (error instanceof Error && error.message.startsWith("Google Sheet request failed")) {
      return NextResponse.json({ error: "Google Sheet access is not public. Update the Apps Script deployment access to Anyone." }, { status: 502 });
    }
    return NextResponse.json({ error: "Unable to submit the form." }, { status: 500 });
  }
}