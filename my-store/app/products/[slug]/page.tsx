import { ProductLanding } from "../../page";
import { getPublishedProducts } from "../../../lib/products";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await getPublishedProducts()).find((item) => item.slug === slug);
  if (!product) notFound();
  return <ProductLanding slug={slug} initialProduct={product} />;
}
