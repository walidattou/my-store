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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    return NextResponse.json({ error: "Unable to submit the form." }, { status: 500 });
  }
}