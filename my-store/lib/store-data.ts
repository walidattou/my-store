import { getSpreadsheet } from "./sheets";

export type StoreRecord = Record<string, string | number | boolean>;

type CachedRows = {
  expiresAt: number;
  rows: StoreRecord[];
};

const CACHE_TTL_MS = 30_000;
const rowCache = new Map<string, CachedRows>();

const schemas: Record<string, string[]> = {
  Products: ["Id", "Name", "Slug", "ShortDescription", "Description", "Price", "CompareAtPrice", "Stock", "Images", "Colors", "Features", "Category", "Collection", "Status", "CreatedAt", "UpdatedAt"],
  Orders: ["Id", "Name", "Number", "Willaya", "Commune", "Address", "Livraison", "Color", "Product", "Quantity", "Total", "Status", "CreatedAt", "UpdatedAt"],
  Delivery: ["Willaya", "HomePrice", "OfficePrice", "Enabled"],
  Settings: ["Key", "Value"],
  Activity: ["Id", "Action", "Details", "CreatedAt"],
};

async function getTab(name: string) {
  const doc = await getSpreadsheet();
  let tab = doc.sheetsByTitle[name];
  if (!tab) {
    try {
      tab = await doc.addSheet({ title: name, headerValues: schemas[name] });
    } catch (error) {
      if (!String(error).includes(`name \"${name}\" already exists`)) throw error;
      await doc.loadInfo();
      tab = doc.sheetsByTitle[name];
    }
  }
  if (!tab) throw new Error(`Unable to load sheet tab: ${name}`);
  await tab.loadHeaderRow();
  const expectedHeaders = schemas[name];
  if (expectedHeaders.some((header) => !tab.headerValues.includes(header))) {
    await tab.setHeaderRow(expectedHeaders);
    await tab.loadHeaderRow();
  }
  return tab;
}

function invalidateCache(name: string) {
  rowCache.delete(name);
}

export async function listRecords(name: keyof typeof schemas) {
  const now = Date.now();
  const cached = rowCache.get(name);
  if (cached && cached.expiresAt > now) return cached.rows;

  const tab = await getTab(name);
  const rows = (await tab.getRows()).map((row) => {
    const record: StoreRecord = {};
    for (const header of schemas[name]) record[header] = row.get(header) ?? "";
    return record;
  });

  rowCache.set(name, { expiresAt: now + CACHE_TTL_MS, rows });
  return rows;
}

export async function addRecord(name: keyof typeof schemas, values: StoreRecord) {
  const tab = await getTab(name);
  await tab.addRow(values);
  invalidateCache(name);
}

export async function updateRecord(name: keyof typeof schemas, id: string, values: StoreRecord) {
  const tab = await getTab(name);
  const row = (await tab.getRows()).find((candidate) => candidate.get("Id") === id);
  if (!row) throw new Error("Record not found");
  Object.entries(values).forEach(([key, value]) => row.set(key, value));
  await row.save();
  invalidateCache(name);
}

export async function deleteRecord(name: keyof typeof schemas, id: string) {
  const tab = await getTab(name);
  const row = (await tab.getRows()).find((candidate) => candidate.get("Id") === id);
  if (!row) throw new Error("Record not found");
  await row.delete();
  invalidateCache(name);
}

export async function logActivity(action: string, details: string) {
  await addRecord("Activity", { Id: crypto.randomUUID(), Action: action, Details: details, CreatedAt: new Date().toISOString() });
}
