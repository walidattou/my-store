import { listRecords, StoreRecord } from "./store-data";

export type StoreProduct = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  priceValue: number;
  images: string[];
  colors: string[];
  details: string[];
};

export function mapProduct(item: StoreRecord): StoreProduct {
  const split = (value: string | number | boolean) => String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
  return { slug: String(item.Slug || item.Id || "product"), name: String(item.Name || ""), subtitle: String(item.ShortDescription || ""), description: String(item.Description || ""), priceValue: Number(item.Price || 0), images: split(item.Images), colors: split(item.Colors), details: split(item.Features) };
}

export async function getPublishedProducts() {
  const records = await listRecords("Products");
  return records.filter((item) => String(item.Status || "Published") === "Published").map(mapProduct);
}
