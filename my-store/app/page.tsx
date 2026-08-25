"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { StoreProduct } from "../lib/products";

const wilayas = ["Alger", "Oran", "Blida", "Boumerdès", "Sétif", "Constantine", "Annaba", "Tlemcen", "Autre"];
type Status = "idle" | "loading" | "success" | "error";

export function ProductLanding({ slug, initialProduct = null }: { slug?: string; initialProduct?: StoreProduct | null }) {
  const [form, setForm] = useState({ name: "", phone: "", wilaya: "", commune: "", livraison: "À domicile", color: "Noir", quantity: 1 });
  const [activeImage, setActiveImage] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [storeProduct, setStoreProduct] = useState<StoreProduct | null>(initialProduct);
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  useEffect(() => { fetch(`/api/storefront${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`).then((response) => response.json()).then((data) => { if (data.product) setStoreProduct(data.product); setCatalog(data.products ?? []); }).catch(() => undefined); }, [slug]);
  if (!storeProduct) return <main className="storefront"><header className="site-header"><span className="brand">ATELIER<span>.</span></span></header><p className="product-loading">Chargement de la collection...</p></main>;
  const currentProduct = storeProduct;
  const deliveryPrice = form.livraison === "À domicile" ? 500 : 300;
  const productTotal = currentProduct.priceValue * form.quantity;
  const orderTotal = productTotal + deliveryPrice;

  function formatPrice(value: number) {
    return `${value.toLocaleString("fr-DZ")} دج`;
  }

  function updateField(field: string, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/submit-form", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, product: currentProduct.name, total: orderTotal }) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Submission failed");
      }
      setStatus("success");
      setForm((current) => ({ ...current, name: "", phone: "", wilaya: "", commune: "", quantity: 1 }));
    } catch { setStatus("error"); }
  }

  return (
    <main className="storefront">
      <header className="site-header"><span className="brand">ATELIER<span>.</span></span><span className="header-note">Collection essentielle · Algérie</span></header>
      <section className="product-layout">
        <div className="gallery"><div className="main-image" style={{ backgroundImage: `url(${storeProduct.images[activeImage]})` }} role="img" aria-label={storeProduct.name}><span className="image-label">Édition 01 / 03</span></div><div className="thumbnails">{storeProduct.images.map((image, index) => <button className={activeImage === index ? "thumbnail active" : "thumbnail"} key={image} onClick={() => setActiveImage(index)} style={{ backgroundImage: `url(${image})` }} aria-label={`Voir la photo ${index + 1}`} />)}</div></div>
        <div className="product-copy">
          <p className="eyebrow">Nouvelle arrivée / 2026</p><h1>{storeProduct.name}</h1><p className="subtitle">{storeProduct.subtitle}</p><p className="price">{formatPrice(storeProduct.priceValue)}</p><p className="description">{storeProduct.description}</p><ul className="details">{storeProduct.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          <form onSubmit={handleSubmit} className="order-form">
            <div className="option-row"><div><label>Couleur</label><div className="choices">{storeProduct.colors.map((option) => <button type="button" className={form.color === option ? "color-choice selected" : "color-choice"} key={option} onClick={() => updateField("color", option)} aria-label={option}><span className={`swatch ${option.toLowerCase()}`} /></button>)}</div></div></div>
            <div className="form-heading"><span>Commander maintenant</span><span className="delivery-note">Paiement à la livraison</span></div>
            <div className="form-grid">
              <label htmlFor="name">Nom & prénom<input id="name" type="text" value={form.name} onChange={(event) => updateField("name", event.target.value)} required autoComplete="name" placeholder="Votre nom complet" /></label><label htmlFor="phone">Numéro de téléphone<input id="phone" type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required autoComplete="tel" placeholder="05 00 00 00 00" /></label><label htmlFor="wilaya">Wilaya<select id="wilaya" value={form.wilaya} onChange={(event) => updateField("wilaya", event.target.value)} required><option value="">Sélectionner</option>{wilayas.map((option) => <option key={option}>{option}</option>)}</select></label><label htmlFor="commune">Commune<input id="commune" type="text" value={form.commune} onChange={(event) => updateField("commune", event.target.value)} required placeholder="Votre commune" /></label><label htmlFor="livraison">Livraison<select id="livraison" value={form.livraison} onChange={(event) => updateField("livraison", event.target.value)}><option>À domicile</option><option>Bureau de livraison</option></select></label><label htmlFor="quantity">Quantité<input id="quantity" type="number" min="1" max="20" value={form.quantity} onChange={(event) => updateField("quantity", Number(event.target.value))} required /></label>
            </div>
            <div className="order-summary" aria-label="Résumé de la commande">
              <div><span>Produit × {form.quantity}</span><strong>{formatPrice(productTotal)}</strong></div>
              <div><span>Livraison · {form.livraison}</span><strong>{formatPrice(deliveryPrice)}</strong></div>
              <div className="summary-total"><span>Total</span><strong>{formatPrice(orderTotal)}</strong></div>
            </div>
            <button className="submit-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "Envoi en cours..." : `Commander · ${formatPrice(orderTotal)}`}</button><p className={`form-message ${status}`} role="status" aria-live="polite">{status === "success" && "Votre commande est bien enregistrée. Nous vous contacterons rapidement."}{status === "error" && "Une erreur est survenue. Vérifiez vos informations et réessayez."}</p>
          </form>
        </div>
      </section>
      {!slug && <section className="catalog-section" aria-labelledby="catalog-title"><div className="catalog-heading"><div><p className="eyebrow">La collection</p><h2 id="catalog-title">Tous les produits</h2></div><span>{catalog.length} référence(s)</span></div><div className="product-grid">{catalog.map((item) => <a className="product-card" href={`/products/${item.slug}`} key={item.slug}><div className="product-card-image" style={{ backgroundImage: `url(${item.images[0]})` }} /><div className="product-card-info"><div><h3>{item.name}</h3><p>{item.subtitle}</p></div><strong>{formatPrice(item.priceValue)}</strong></div></a>)}</div></section>}
      <footer>Expédition dans toute l&apos;Algérie <span>·</span> Retour sous 7 jours</footer>
    </main>
  );
}

function HomePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/storefront")
      .then((response) => response.json() as Promise<{ products?: StoreProduct[] }>)
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);
  const featured = products[0];
    return <main className="home-page"><header className="home-header"><Link className="brand" href="/">ATELIER<span>.</span></Link><nav><a href="#collection">La collection</a><a href="#story">Notre approche</a></nav><a className="home-order-link" href={featured ? `/products/${featured.slug}` : "#collection"}>Commander <span>↗</span></a></header>{loading ? <div className="home-loading"><span /> <p>La collection arrive...</p></div> : products.length === 0 ? <div className="home-empty"><p className="home-kicker">Atelier / Collection</p><h1>Bientôt disponible.</h1><p>Notre prochaine sélection arrive très bientôt.</p></div> : <><section className="home-hero"><div className="hero-copy"><p className="home-kicker">Collection 01 / Algérie</p><h1>Les essentiels, <em>bien choisis.</em></h1><p>Des pièces pensées pour accompagner les journées ordinaires avec plus de confort, de caractère et de simplicité.</p><a className="hero-link" href="#collection">Explorer la collection <span>↓</span></a></div><a className="hero-feature" href={`/products/${featured.slug}`}><div className="hero-feature-image" style={{ backgroundImage: `url(${featured.images[0]})` }}><span>Pièce sélectionnée</span></div><div className="hero-feature-meta"><div><strong>{featured.name}</strong><small>{featured.subtitle}</small></div><b>{featured.priceValue.toLocaleString("fr-DZ")} DA <span>↗</span></b></div></a></section><section className="home-intro" id="story"><p className="home-kicker">Une garde-robe plus précise</p><p>Nous cherchons les matières agréables, les coupes qui durent et les détails qui font qu&apos;une pièce revient naturellement dans votre quotidien.</p><span>01 — 03</span></section><section className="home-collection" id="collection"><div className="collection-heading"><div><p className="home-kicker">La sélection actuelle</p><h2>À porter maintenant</h2></div><span>{products.length} pièce{products.length > 1 ? "s" : ""}</span></div><div className="home-grid">{products.map((product, index) => <a className="home-card" href={`/products/${product.slug}`} key={product.slug}><div className="home-card-image" style={{ backgroundImage: `url(${product.images[0]})` }}><span>0{index + 1}</span><i>Voir ↗</i></div><div className="home-card-info"><div><h3>{product.name}</h3><p>{product.subtitle}</p></div><strong>{product.priceValue.toLocaleString("fr-DZ")} DA</strong></div></a>)}</div></section></>}<footer className="home-footer"><span>ATELIER.</span><span>Expédition dans toute l&apos;Algérie</span><span>© 2026</span></footer></main>;
}

export default function Home() { return <HomePage />; }