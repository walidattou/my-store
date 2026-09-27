"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Banknote, Droplets, Footprints, Gem, Globe2, Grid2X2, Headphones, Home as HomeIcon, MessageCircle, Music2, Shirt, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { StoreProduct } from "../lib/products";

const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar",
  "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa",
  "Aflou", "Barika", "Ksar Chellala", "Messaad", "Aïn Oussera", "Bou Saâda", "El Abiodh Sidi Cheikh", "El Kantara", "Bir El Ater", "Ksar El Boukhari", "El Aricha",
];
type Status = "idle" | "loading" | "success" | "error";

export function ProductLanding({ slug, initialProduct = null }: { slug?: string; initialProduct?: StoreProduct | null }) {
  const [form, setForm] = useState({ name: "", phone: "", wilaya: "", commune: "", livraison: "À domicile", color: "Noir", quantity: 1 });
  const [activeImage, setActiveImage] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [storeProduct, setStoreProduct] = useState<StoreProduct | null>(initialProduct);
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  useEffect(() => { fetch(`/api/storefront${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`).then((response) => response.json()).then((data) => { if (data.product) setStoreProduct(data.product); setCatalog(data.products ?? []); }).catch(() => undefined); }, [slug]);
  if (!storeProduct) return <main className="product-store" dir="rtl"><header className="site-header"><Link className="product-logo" href="/">جودة<Sparkles aria-hidden="true" /></Link></header><p className="product-loading">جاري تجهيز المنتج...</p></main>;
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
    <main className="product-store" dir="rtl">
      <header className="site-header"><Link className="product-logo" href="/">جودة<Sparkles aria-hidden="true" /></Link></header>
      <section className="product-layout">
        <div className="gallery"><div className="main-image" style={{ backgroundImage: `url(${storeProduct.images[activeImage]})` }} role="img" aria-label={storeProduct.name}><span className="image-label">Édition 01 / 03</span></div><div className="thumbnails">{storeProduct.images.map((image, index) => <button className={activeImage === index ? "thumbnail active" : "thumbnail"} key={image} onClick={() => setActiveImage(index)} style={{ backgroundImage: `url(${image})` }} aria-label={`Voir la photo ${index + 1}`} />)}</div></div>
        <div className="product-copy">
          <p className="eyebrow">اختيار الأسبوع · إصدار محدود</p><h1>{storeProduct.name}</h1><p className="subtitle">{storeProduct.subtitle}</p><div className="product-rating"><span>★★★★★</span> تقييمات موثوقة من عملائنا</div><p className="price">{formatPrice(currentProduct.priceValue)} <small>السعر شامل الجودة</small></p><p className="description">{storeProduct.description}</p><ul className="details">{storeProduct.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><div className="product-benefits"><span><Truck aria-hidden="true" /><b>توصيل سريع</b><small>إلى كل الولايات</small></span><span><Banknote aria-hidden="true" /><b>الدفع عند الاستلام</b><small>بدون دفع مسبق</small></span><span><ShieldCheck aria-hidden="true" /><b>اختيار مضمون</b><small>جودة نثق بها</small></span></div>
          <form onSubmit={handleSubmit} className="order-form">
            <div className="option-row"><div><label>اختر اللون</label><div className="choices">{storeProduct.colors.map((option) => <button type="button" className={form.color === option ? "color-choice selected" : "color-choice"} key={option} onClick={() => updateField("color", option)} aria-pressed={form.color === option}>{option}</button>)}</div></div></div>
            <div className="form-heading"><span>أكمل طلبك الآن</span><span className="delivery-note">الدفع عند الاستلام</span></div>
            <div className="form-grid">
              <label htmlFor="name">الاسم واللقب<input id="name" type="text" value={form.name} onChange={(event) => updateField("name", event.target.value)} required autoComplete="name" placeholder="اكتب اسمك الكامل" /></label><label htmlFor="phone">رقم الهاتف<input id="phone" type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required autoComplete="tel" placeholder="05 00 00 00 00" /></label><label htmlFor="wilaya">الولاية<select id="wilaya" value={form.wilaya} onChange={(event) => updateField("wilaya", event.target.value)} required><option value="">اختر الولاية</option>{wilayas.map((option) => <option key={option}>{option}</option>)}</select></label><label htmlFor="commune">البلدية<input id="commune" type="text" value={form.commune} onChange={(event) => updateField("commune", event.target.value)} required placeholder="اكتب بلديتك" /></label><label htmlFor="livraison">طريقة التوصيل<select id="livraison" value={form.livraison} onChange={(event) => updateField("livraison", event.target.value)}><option>À domicile</option><option>Bureau de livraison</option></select></label><label htmlFor="quantity">الكمية<input id="quantity" type="number" min="1" max="20" value={form.quantity} onChange={(event) => updateField("quantity", Number(event.target.value))} required /></label>
            </div>
            <div className="order-summary" aria-label="Résumé de la commande">
              <div><span>Produit × {form.quantity}</span><strong>{formatPrice(productTotal)}</strong></div>
              <div><span>Livraison · {form.livraison}</span><strong>{formatPrice(deliveryPrice)}</strong></div>
              <div className="summary-total"><span>Total</span><strong>{formatPrice(orderTotal)}</strong></div>
            </div>
            <button className="submit-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "جاري إرسال الطلب..." : `تأكيد الطلب · ${formatPrice(orderTotal)}`}</button><p className={`form-message ${status}`} role="status" aria-live="polite">{status === "success" && "تم تسجيل طلبك بنجاح. سنتواصل معك قريبًا لتأكيده."}{status === "error" && "حدث خطأ. تحقق من معلوماتك وحاول مرة أخرى."}</p>
          </form>
        </div>
      </section>
      {!slug && <section className="catalog-section" aria-labelledby="catalog-title"><div className="catalog-heading"><div><p className="eyebrow">La collection</p><h2 id="catalog-title">Tous les produits</h2></div><span>{catalog.length} référence(s)</span></div><div className="product-grid">{catalog.map((item) => <a className="product-card" href={`/products/${item.slug}`} key={item.slug}><div className="product-card-image" style={{ backgroundImage: `url(${item.images[0]})` }} /><div className="product-card-info"><div><h3>{item.name}</h3><p>{item.subtitle}</p></div><strong>{formatPrice(item.priceValue)}</strong></div></a>)}</div></section>}
    </main>
  );
}

function LegacyHomePage() {
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

void LegacyHomePage;
void JawdaHomePage;

function JawdaHomePage() {
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

  return <main className="jawda-page" dir="rtl">
    <header className="jawda-header">
      <Link className="jawda-logo" href="/">جودة<span>✦</span></Link>
      <nav aria-label="التنقل الرئيسي"><a href="#collection">المتجر</a><a href="#story">قصتنا</a><a href="#benefits">لماذا جودة؟</a></nav>
      <a className="jawda-header-cta" href={featured ? `/products/${featured.slug}` : "#collection"}>تسوّق الآن <span>←</span></a>
    </header>
    {loading ? <div className="jawda-loading"><span /> <p>نجهّز لك المجموعة...</p></div> : products.length === 0 ? <div className="jawda-empty"><p className="jawda-kicker">جودة / المجموعة الجديدة</p><h1>قريبًا بين يديك.</h1><p>نعمل على تجهيز منتجات مختارة بعناية. عد إلينا قريبًا.</p></div> : <>
      <section className="jawda-hero">
        <div className="jawda-hero-copy"><p className="jawda-kicker">اختيارات يومية • توصيل لكل الجزائر</p><h1>تفاصيل صغيرة،<br /><em>فرق كبير.</em></h1><p>منتجات عملية وأنيقة نختارها لتضيف لمسة أجمل إلى يومك، بجودة تستحقها وسعر واضح.</p><a className="jawda-hero-link" href="#collection">اكتشف المجموعة <span>↓</span></a></div>
        <a className="jawda-feature" href={`/products/${featured.slug}`}><div className="jawda-feature-image" style={{ backgroundImage: `url(${featured.images[0]})` }}><span>اختيارنا لك</span><b>جودة</b></div><div className="jawda-feature-meta"><div><strong>{featured.name}</strong><small>{featured.subtitle}</small></div><b>{featured.priceValue.toLocaleString("ar-DZ")} دج <span>←</span></b></div></a>
      </section>
      <section className="jawda-story" id="story"><p className="jawda-kicker">لماذا جودة؟</p><p>نؤمن أن التسوق الجيد يبدأ من اختيار صادق: منتجات مفيدة، تفاصيل جميلة، وتجربة بسيطة من أول نقرة حتى وصول طلبك إلى بابك.</p><span>01 — 03</span></section>
      <section className="jawda-collection" id="collection"><div className="jawda-section-heading"><div><p className="jawda-kicker">المجموعة الحالية</p><h2>اختيارات تستحقها</h2></div><span>{products.length} منتجات</span></div><div className="jawda-grid">{products.map((product, index) => <a className="jawda-card" href={`/products/${product.slug}`} key={product.slug}><div className="jawda-card-image" style={{ backgroundImage: `url(${product.images[0]})` }}><span>{index === 0 ? "الأكثر طلبًا" : `0${index + 1}`}</span></div><div className="jawda-card-info"><div><h3>{product.name}</h3><p>{product.subtitle}</p></div><strong>{product.priceValue.toLocaleString("ar-DZ")} دج</strong></div><span className="jawda-card-action">عرض المنتج <b>←</b></span></a>)}</div></section>
      <section className="jawda-benefits" id="benefits"><div><span className="benefit-number">01</span><h3>دفع عند الاستلام</h3><p>اطلب براحة وادفع بعد استلام منتجك.</p></div><div><span className="benefit-number">02</span><h3>توصيل سريع</h3><p>نصل إليك في كل ولايات الجزائر.</p></div><div><span className="benefit-number">03</span><h3>اختيار موثوق</h3><p>منتجات نختبرها ونختارها بعناية.</p></div></section>
    </>}
    <footer className="jawda-footer"><strong>جودة<span>✦</span></strong><span>تسوق بثقة • عِش بجودة</span><span>© 2026</span></footer>
  </main>;
}

function FashionHomePage() {
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
  const formatPrice = (value: number) => `${value.toLocaleString("ar-DZ")} دج`;

  if (loading) return <main className="fashion-store" dir="rtl"><div className="fashion-loading"><span />جاري تجهيز المتجر...</div></main>;
  if (!featured) return <main className="fashion-store" dir="rtl"><div className="fashion-empty"><h1>جودة</h1><p>المجموعة الجديدة قادمة قريبًا.</p></div></main>;

  return <main className="fashion-store" dir="rtl">
    <aside className="fashion-sidebar">
      <Link className="fashion-brand" href="/">جودة<span>✦</span></Link>
      <nav className="fashion-nav" aria-label="القائمة"><a className="active" href="#top">⌂ <span>الرئيسية</span></a><a href="#collection">▦ <span>التصنيفات</span></a><a href="#deals">♢ <span>العروض</span><b>جديد</b></a><a href="#collection">♡ <span>الأكثر مبيعًا</span></a><a href="#collection">✧ <span>الماركات</span></a><a href="#collection">▧ <span>المجموعات</span></a><a href="#orders">▤ <span>طلباتي</span></a><a href="#wishlist">♡ <span>المفضلة</span></a></nav>
      <div className="sidebar-sale"><small>عرض الموسم</small><strong>خصم<br />حتى 50%</strong><a href="#collection">تسوق الآن ←</a><span>٪</span></div>
      <a className="sidebar-help" href="#footer">◌ <span><b>هل تحتاج مساعدة؟</b>تواصل معنا</span></a>
      <button className="light-mode" type="button">☼ <span>الوضع الفاتح</span><i /></button>
    </aside>
    <section className="fashion-main" id="top">
      <header className="fashion-topbar"><Link className="fashion-topbar-logo" href="/" aria-label="العودة إلى الصفحة الرئيسية">جودة<Sparkles className="brand-icon" aria-hidden="true" /></Link></header>
      <div className="fashion-content">
        <section className="jawda-hero-new">
          <div className="jawda-hero-content"><span className="jawda-hero-label"><Sparkles size={14} aria-hidden="true" /> المجموعة المختارة</span><h1>اختيارك،<br /><em>أسلوبك.</em></h1><p>قطعة واحدة قد تغيّر كل الإطلالة.</p><a className="jawda-hero-button" href="#collection">اكتشف المجموعة <ArrowLeft size={16} aria-hidden="true" /></a><div className="jawda-hero-note"><span>01</span><small>اختيارات بسيطة<br />بتأثير كبير</small></div></div>
          <a className="jawda-hero-visual" href={`/products/${featured.slug}`} aria-label={`اكتشف ${featured.name}`}><div className="jawda-hero-image" style={{ backgroundImage: `url(${featured.images[0]})` }} /><span className="jawda-hero-stamp">جودة<br /><small>منتقى بعناية</small></span><span className="jawda-hero-index">01 <i /> 03</span><div className="jawda-hero-product"><small>الاختيار الحالي</small><strong>{featured.name}</strong><span>{featured.priceValue.toLocaleString("ar-DZ")} دج <ArrowLeft size={14} aria-hidden="true" /></span></div></a>
        </section>
        <section className="fashion-categories" id="collection"><a href="#collection"><span><Shirt aria-hidden="true" /></span>ملابس</a><a href="#collection"><span><Droplets aria-hidden="true" /></span>عناية شخصية</a><a href="#collection"><span><Gem aria-hidden="true" /></span>إكسسوارات</a><a href="#collection"><span><HomeIcon aria-hidden="true" /></span>المنزل</a><a href="#collection"><span><Footprints aria-hidden="true" /></span>أحذية</a><a href="#collection"><span><Grid2X2 aria-hidden="true" /></span>المزيد</a></section>
        <section className="fashion-promos" id="deals"><div><span>اختيار الأسبوع</span><p>خصم يصل إلى 25%<br /><small>على القطع المختارة</small></p><b>لفترة محدودة</b></div><div><span>شحن مجاني</span><p>للطلبات فوق 6500 دج<br /><small>اطلب الآن واستفد</small></p><b>←</b></div><div><span>وصل حديثًا</span><p>اكتشف الجديد<br /><small>تصميمات هذا الأسبوع</small></p><b>←</b></div></section>
        <ProductShelf title="الأكثر طلبًا" products={products} formatPrice={formatPrice} />
        <ProductShelf title="مقترح لك" products={products.slice().reverse()} formatPrice={formatPrice} />
        <section className="fashion-trust" id="footer"><span><ShieldCheck aria-hidden="true" /><b>تسوق آمن</b><small>بياناتك محمية</small></span><span><Banknote aria-hidden="true" /><b>الدفع عند الاستلام</b><small>ادفع بعد وصول طلبك</small></span><span><Headphones aria-hidden="true" /><b>دعم متواصل</b><small>نحن هنا لمساعدتك</small></span><span><BadgeCheck aria-hidden="true" /><b>منتجات أصلية</b><small>اختيار موثوق</small></span></section>
        <footer className="fashion-footer"><div><Link className="fashion-brand" href="/">جودة<Sparkles className="brand-icon" aria-hidden="true" /></Link><p>اختيارات جميلة ليومك، تصل إليك بثقة.</p></div><div><h3>المتجر</h3><a href="#collection">كل المنتجات</a><a href="#deals">العروض</a><a href="#collection">وصل حديثًا</a></div><div><h3>مساعدتك</h3><a href="#footer">تواصل معنا</a><a href="#footer">سياسة الإرجاع</a><a href="#footer">الشحن والتوصيل</a></div><div><h3>تابع جودة</h3><p>كن أول من يعرف جديدنا وعروضنا.</p><div className="footer-social"><a href="#footer" aria-label="الموقع"><Globe2 size={15} aria-hidden="true" /></a><a href="#footer" aria-label="التواصل"><MessageCircle size={15} aria-hidden="true" /></a><a href="#footer" aria-label="الموسيقى"><Music2 size={15} aria-hidden="true" /></a></div></div><small className="footer-copy">© 2026 جودة. جميع الحقوق محفوظة.</small></footer>
      </div>
    </section>
  </main>;
}

function ProductShelf({ title, products, formatPrice }: { title: string; products: StoreProduct[]; formatPrice: (value: number) => string }) {
  return <section className="product-shelf"><div className="shelf-heading"><h2>{title}</h2><a href="#collection">عرض الكل <ArrowLeft size={13} aria-hidden="true" /></a></div><div className="shelf-grid">{products.slice(0, 4).map((product, index) => <article className="shelf-card" key={`${title}-${product.slug}`}><a href={`/products/${product.slug}`} className="shelf-image" style={{ backgroundImage: `url(${product.images[0]})` }}><span>{index === 0 ? "خصم" : "جديد"}</span><b>♡</b></a><div className="shelf-info"><h3>{product.name}</h3><p>{product.subtitle}</p><strong>{formatPrice(product.priceValue)}</strong><span className="rating">★ 4.8 (24)</span><a className="shelf-buy" href={`/products/${product.slug}`} aria-label={`شراء ${product.name}`}><ArrowLeft size={14} aria-hidden="true" /></a></div></article>)}</div></section>;
}

export default function Home() { return <FashionHomePage />; }