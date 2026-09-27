"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Package, ShoppingBag, Sparkles } from "lucide-react";

type RecordValue = Record<string, string | number | boolean>;
const navigation = [
  { id: "Dashboard", label: "Vue d'ensemble", Icon: LayoutDashboard },
  { id: "Orders", label: "Commandes", Icon: ShoppingBag },
  { id: "Products", label: "Produits", Icon: Package },
];
const tabFor = (section: string) =>
  (
    ({
      Orders: "Orders",
      Products: "Products",
    }) as Record<string, string>
  )[section];
const sectionLabels: Record<string, string> = {
  Dashboard: "Vue d'ensemble",
  Orders: "Commandes",
  Products: "Produits",
};
async function fetchRecords(tab: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/admin/data?tab=${encodeURIComponent(tab)}`,
    { signal, cache: "no-store" },
  );
  const body = await response.text();
  const data = body
    ? (JSON.parse(body) as { records?: RecordValue[]; error?: string })
    : { error: "Réponse vide du serveur" };
  if (!response.ok)
    throw new Error(data.error || "Impossible de charger les données");
  return data.records ?? [];
}

export default function AdminPanel() {
  const [section, setSection] = useState("Dashboard");
  const [records, setRecords] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const router = useRouter();
  const tab = section === "Dashboard" ? "Orders" : tabFor(section);
  function selectSection(nextSection: string) {
    setRecords([]);
    setLoading(Boolean(nextSection === "Dashboard" || tabFor(nextSection)));
    setSection(nextSection);
  }
  useEffect(() => {
    const controller = new AbortController();
    if (!tab) {
      return () => controller.abort();
    }
    void fetchRecords(tab, controller.signal)
      .then(setRecords)
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError")
          console.error(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab]);
  async function updateOrder(id: string, status: string) {
    await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        tab: "Orders",
        id,
        values: { Status: status, UpdatedAt: new Date().toISOString() },
      }),
    });
    if (tab) setRecords(await fetchRecords(tab));
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }
  const revenue = records.reduce(
    (sum, order) => sum + Number(order.Total || 0),
    0,
  );
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-mark">جودة<Sparkles aria-hidden="true" /></span>
          <small>GESTION DU MAGASIN</small>
        </div>
        <nav>
          {navigation.map((item) => (
            <button
              className={section === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => selectSection(item.id)}
            >
              <item.Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut aria-hidden="true" />
          Se déconnecter
        </button>
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">جودة / GESTION DU MAGASIN</p>
            <h1>{sectionLabels[section]}</h1>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            Voir la boutique <span aria-hidden="true">↗</span>
          </a>
        </header>
        {section === "Dashboard" ? (
          <Dashboard
            records={records}
            revenue={revenue}
            onOpen={selectSection}
            onAddProduct={() => setShowProductForm(true)}
          />
        ) : tab ? (
          <DataSection
            section={section}
            records={records}
            loading={loading}
            onStatus={updateOrder}
            onAdd={() =>
              section === "Products" ? setShowProductForm(true) : undefined
            }
          />
        ) : null}
        {showProductForm && (
          <ProductForm
            onClose={() => setShowProductForm(false)}
            onSaved={() => {
              setShowProductForm(false);
              if (tab) void fetchRecords(tab).then(setRecords);
            }}
          />
        )}
      </section>
    </main>
  );
}

function Dashboard({
  records,
  revenue,
  onOpen,
  onAddProduct,
}: {
  records: RecordValue[];
  revenue: number;
  onOpen: (section: string) => void;
  onAddProduct: () => void;
}) {
  return (
    <>
      <div className="metric-grid">
        <Metric
          label="Chiffre d'affaires"
          value={`${revenue.toLocaleString("fr-DZ")} DA`}
        />
        <Metric label="Commandes" value={records.length.toString()} />
        <Metric
          label="En attente"
          value={records
            .filter((record) => !record.Status || record.Status === "Pending")
            .length.toString()}
        />
        <Metric
          label="Livrées"
          value={records
            .filter((record) => record.Status === "Delivered")
            .length.toString()}
        />
      </div>
      <div className="dashboard-grid">
        <div className="admin-panel">
          <div className="panel-title">
            <h2>Commandes récentes</h2>
            <button onClick={() => onOpen("Orders")}>Tout voir</button>
          </div>
          {records.length === 0 ? (
            <p className="empty">
              Aucune commande. Les commandes reçues apparaîtront ici.
            </p>
          ) : (
            <OrderTable records={records.slice(-8).reverse()} />
          )}
        </div>
        <div className="admin-panel quick-actions">
          <h2>Actions rapides</h2>
          <button onClick={onAddProduct}>+ Ajouter un produit</button>
          <button onClick={() => onOpen("Orders")}>Voir les commandes</button>
        </div>
      </div>
    </>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function DataSection({
  section,
  records,
  loading,
  onStatus,
  onAdd,
}: {
  section: string;
  records: RecordValue[];
  loading: boolean;
  onStatus: (id: string, status: string) => void;
  onAdd?: () => void;
}) {
  return (
    <div className="admin-panel data-panel">
      <div className="panel-title">
        <div>
          <h2>{sectionLabels[section]}</h2>
          <p>{records.length} élément(s) synchronisé(s) avec Google Sheets</p>
        </div>
        {onAdd && (
          <button className="primary-action" onClick={onAdd}>
            + Ajouter un produit
          </button>
        )}
      </div>
      {loading ? (
        <p className="empty">Chargement...</p>
      ) : section === "Orders" ? (
        <OrderTable records={records} onStatus={onStatus} />
      ) : (
        <GenericTable section={section} records={records} />
      )}
    </div>
  );
}
function OrderTable({
  records,
  onStatus,
}: {
  records: RecordValue[];
  onStatus?: (id: string, status: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [sortKey, setSortKey] = useState("CreatedAt");
  const [sortDescending, setSortDescending] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const columns = [
    "Id",
    "Name",
    "Number",
    "Willaya",
    "Commune",
    "Address",
    "Livraison",
    "Color",
    "Product",
    "Quantity",
    "Total",
    "Status",
    "CreatedAt",
    "UpdatedAt",
  ];
  const months = Array.from(
    new Set(
      records
        .map((record) => String(record.CreatedAt || "").slice(0, 7))
        .filter(Boolean),
    ),
  )
    .sort()
    .reverse();
  const filteredRecords = records
    .filter((record) => {
      const matchesQuery =
        !query ||
        columns.some((column) =>
          String(record[column] ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        );
      const matchesStatus =
        statusFilter === "All" ||
        String(record.Status || "Pending") === statusFilter;
      const matchesMonth =
        monthFilter === "All" ||
        String(record.CreatedAt || "").startsWith(monthFilter);
      return matchesQuery && matchesStatus && matchesMonth;
    })
    .sort((left, right) => {
      const leftValue = String(left[sortKey] ?? "");
      const rightValue = String(right[sortKey] ?? "");
      return (
        (leftValue.localeCompare(rightValue, undefined, { numeric: true }) ||
          0) * (sortDescending ? -1 : 1)
      );
    });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = filteredRecords.slice(
    (Math.min(page, totalPages) - 1) * pageSize,
    Math.min(page, totalPages) * pageSize,
  );
  function updateFilter(update: () => void) {
    update();
    setPage(1);
  }
  function sortBy(column: string) {
    if (sortKey === column) setSortDescending((current) => !current);
    else {
      setSortKey(column);
      setSortDescending(false);
    }
  }
  function formatDate(value: RecordValue[string]) {
    const date = new Date(String(value || ""));
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        });
  }
  function exportCsv() {
    const csv = [
      columns,
      ...filteredRecords.map((record) =>
        columns.map(
          (column) => `"${String(record[column] ?? "").replace(/"/g, '""')}"`,
        ),
      ),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <>
      <div className="orders-toolbar">
        <input
          value={query}
          onChange={(event) => updateFilter(() => setQuery(event.target.value))}
          placeholder="Rechercher une commande..."
          aria-label="Rechercher une commande"
        />
        <select
          value={monthFilter}
          onChange={(event) =>
            updateFilter(() => setMonthFilter(event.target.value))
          }
          aria-label="Filtrer par mois"
        >
          <option value="All">Tous les mois</option>
          {months.map((month) => (
            <option value={month} key={month}>
              {new Date(`${month}-01T00:00:00`).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) =>
            updateFilter(() => setStatusFilter(event.target.value))
          }
          aria-label="Filtrer par statut"
        >
          <option value="All">Tous les statuts</option>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Preparing</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <span>
          {filteredRecords.length} / {records.length}
        </span>
        <button type="button" onClick={exportCsv}>
          Exporter CSV
        </button>
      </div>
      <div className="table-wrap orders-table">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>
                  <button type="button" onClick={() => sortBy(column)}>
                    {column}
                    {sortKey === column ? (sortDescending ? " ↓" : " ↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record, index) => (
              <tr key={String(record.Id || index)}>
                {columns.map((column) => (
                  <td key={column}>
                    {column === "Id" ? (
                      <span
                        className="order-id"
                        title={String(record[column] ?? "")}
                      >
                        {String(record[column] ?? "").slice(0, 8) || "—"}
                      </span>
                    ) : column === "CreatedAt" || column === "UpdatedAt" ? (
                      <time
                        className="order-date"
                        dateTime={String(record[column] ?? "")}
                        title={String(record[column] ?? "")}
                      >
                        {formatDate(record[column])}
                      </time>
                    ) : column === "Status" ? (
                      onStatus ? (
                        <select
                          className={`status-select ${String(record.Status || "Pending").toLowerCase()}`}
                          value={String(record.Status || "Pending")}
                          onChange={(event) =>
                            onStatus(String(record.Id), event.target.value)
                          }
                        >
                          <option>Pending</option>
                          <option>Confirmed</option>
                          <option>Preparing</option>
                          <option>Shipped</option>
                          <option>Delivered</option>
                          <option>Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`status-badge ${String(record.Status || "Pending").toLowerCase()}`}
                        >
                          {String(record.Status || "Pending") === "Delivered"
                            ? "✓ Livré"
                            : String(record.Status || "Pending") === "Confirmed"
                              ? "✓ Confirmé"
                              : String(record.Status || "Pending") ===
                                  "Cancelled"
                                ? "✕ Annulé"
                                : String(record.Status || "Pending")}
                        </span>
                      )
                    ) : column === "Total" && record[column] ? (
                      `${String(record[column])} DA`
                    ) : (
                      String(record[column] ?? "—")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="orders-pagination">
        <span>
          Page {Math.min(page, totalPages)} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          ← Précédente
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .slice(Math.max(0, page - 3), page + 2)
          .map((pageNumber) => (
            <button
              type="button"
              className={pageNumber === page ? "active" : ""}
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Suivante →
        </button>
      </div>
    </>
  );
}
function GenericTable({
  section,
  records,
}: {
  section: string;
  records: RecordValue[];
}) {
  return records.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Détails</th>
            <th>Statut</th>
            {section === "Products" && <th>Page</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index}>
              <td>
                <strong>
                  {String(record.Name || record.Willaya || record.Key || "—")}
                </strong>
              </td>
              <td>
                {String(
                  record.Description || record.Value || record.HomePrice || "—",
                )}
              </td>
              <td>{String(record.Status || record.Enabled || "Actif")}</td>
              {section === "Products" && (
                <td>
                  <a
                    href={`/products/${String(record.Slug || record.Id)}`}
                    target="_blank"
                  >
                    Voir la page produit ↗
                  </a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="empty">
      Aucune donnée pour le moment. Utilisez “Ajouter” pour commencer.
    </p>
  );
}
function ImageUploader({
  files,
  onChange,
  error,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error: string;
}) {
  const [dragging, setDragging] = useState(false);
  function addFiles(nextFiles: File[]) {
    const valid = nextFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 2 * 1024 * 1024,
    );
    onChange([...files, ...valid].slice(0, 10));
  }
  return (
    <div
      className={dragging ? "image-dropzone dragging" : "image-dropzone"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        addFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        id="product-images"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
      />
      <label htmlFor="product-images" className="image-dropzone-label">
        <strong>Déposer les photos ici</strong>
        <span>
          ou cliquer pour choisir des fichiers · {files.length}/10 images, 4 Mo total maximum
        </span>
      </label>
      {files.length > 0 && (
        <div className="image-preview-grid">
          {files.map((file, index) => (
            <div className="image-preview" key={`${file.name}-${index}`}>
              <Image src={URL.createObjectURL(file)} alt="" fill unoptimized sizes="120px" />
              <button
                type="button"
                onClick={() =>
                  onChange(files.filter((_, fileIndex) => fileIndex !== index))
                }
                aria-label={`Supprimer ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}

function ProductForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    images: "",
    colors: "",
    features: "",
    category: "",
    collection: "",
    status: "Published",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setUploadError("");
    try {
      let uploadedUrls: string[] = [];
      const existingUrls = form.images
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
      if (existingUrls.length + imageFiles.length > 10) {
        throw new Error("Maximum 10 images per product.");
      }
      if (imageFiles.length) {
        const uploadData = new FormData();
        imageFiles.forEach((file) => uploadData.append("files", file));
        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = (await uploadResponse.json()) as {
          urls?: string[];
          error?: string;
        };
        if (!uploadResponse.ok)
          throw new Error(uploadResult.error || "Upload impossible");
        uploadedUrls = uploadResult.urls ?? [];
      }
      const imageUrls = [
        ...existingUrls,
        ...uploadedUrls,
      ]
        .slice(0, 10)
        .join(", ");
      const now = new Date().toISOString();
      const saveResponse = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          tab: "Products",
          values: {
            Id: crypto.randomUUID(),
            Name: form.name,
            Slug:
              form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            ShortDescription: form.shortDescription,
            Description: form.description,
            Price: Number(form.price),
            CompareAtPrice: Number(form.compareAtPrice) || "",
            Stock: Number(form.stock),
            Images: imageUrls,
            Colors: form.colors,
            Features: form.features,
            Category: form.category,
            Collection: form.collection,
            Status: form.status,
            CreatedAt: now,
            UpdatedAt: now,
          },
        }),
      });
      if (!saveResponse.ok)
        throw new Error("Impossible d'enregistrer le produit");
      onSaved();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le produit.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <form className="product-modal" onSubmit={save}>
        <div className="modal-header">
          <div>
            <p className="admin-kicker">Catalogue</p>
            <h2>Ajouter un produit</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-grid">
          <label>
            Nom
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
              placeholder="auto-généré"
            />
          </label>
          <label>
            Prix (DA)
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              required
            />
          </label>
          <label>
            Prix comparé (DA)
            <input
              type="number"
              min="0"
              value={form.compareAtPrice}
              onChange={(event) => update("compareAtPrice", event.target.value)}
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => update("stock", event.target.value)}
              required
            />
          </label>
          <label>
            Statut
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option>Published</option>
              <option>Draft</option>
              <option>Hidden</option>
            </select>
          </label>
          <label>
            Description courte
            <input
              value={form.shortDescription}
              onChange={(event) =>
                update("shortDescription", event.target.value)
              }
            />
          </label>
          <label>
            Couleurs
            <input
              value={form.colors}
              onChange={(event) => update("colors", event.target.value)}
              placeholder="Noir, Blanc"
            />
          </label>
          <label className="wide-field">
            Description complète
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              required
            />
          </label>
          <label className="wide-field">
            Photos (maximum 10)
            <input
              value={form.images}
              onChange={(event) => update("images", event.target.value)}
              placeholder="URLs existantes séparées par des virgules (facultatif)"
            />
            <ImageUploader
              files={imageFiles}
              onChange={setImageFiles}
              error={uploadError}
            />
          </label>
          <label>
            Fonctionnalités
            <input
              value={form.features}
              onChange={(event) => update("features", event.target.value)}
              placeholder="Confort, Premium"
            />
          </label>
          <label>
            Catégorie
            <input
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            />
          </label>
          <label>
            Collection
            <input
              value={form.collection}
              onChange={(event) => update("collection", event.target.value)}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Créer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}
