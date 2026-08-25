import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/admin-auth";
import { addRecord, deleteRecord, listRecords, logActivity, updateRecord } from "../../../../lib/store-data";

const allowedTabs = ["Products", "Orders", "Delivery", "Settings", "Activity"] as const;
type Tab = (typeof allowedTabs)[number];

export async function GET(request: Request) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tab = new URL(request.url).searchParams.get("tab") as Tab;
    if (!allowedTabs.includes(tab)) return NextResponse.json({ error: "Unknown tab" }, { status: 400 });
    return NextResponse.json({ records: await listRecords(tab) });
  } catch (error) {
    console.error("Admin data read failed", error);
    return NextResponse.json({ error: "Unable to read store data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { action, tab, id, values } = await request.json() as { action: "add" | "update" | "delete"; tab: Tab; id?: string; values?: Record<string, string | number | boolean> };
    if (!allowedTabs.includes(tab) || !["add", "update", "delete"].includes(action)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (action === "add") await addRecord(tab, values ?? {});
    if (action === "update" && id) await updateRecord(tab, id, values ?? {});
    if (action === "delete" && id) await deleteRecord(tab, id);
    await logActivity(`${action} ${tab}`, id ?? "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin data operation failed", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
