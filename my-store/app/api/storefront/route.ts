import { NextResponse } from "next/server";
import { getPublishedProducts } from "../../../lib/products";

export async function GET(request: Request) {
  try {
    const published = await getPublishedProducts();
    const slug = new URL(request.url).searchParams.get("slug");
    const selected = slug ? published.find((item) => item.slug === slug) : published[0];
    return NextResponse.json({ products: published, product: selected ?? null });
  } catch (error) {
    console.error("Storefront product read failed", error);
    return NextResponse.json({ product: null }, { status: 200 });
  }
}
