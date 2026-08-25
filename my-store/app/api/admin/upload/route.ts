import { Readable } from "node:stream";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    if (!files.length || files.length > 10) return NextResponse.json({ error: "Choose between 1 and 10 images." }, { status: 400 });
    if (files.some((file) => !file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) || files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
      return NextResponse.json({ error: "Images must be valid and the total upload must be smaller than 4 MB." }, { status: 400 });
    }

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!email || !privateKey) throw new Error("Missing Google service account credentials");
    const auth = new google.auth.JWT({ email, key: privateKey.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/drive"] });
    const drive = google.drive({ version: "v3", auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const urls: string[] = [];

    const uploadedUrls = await Promise.all(files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await drive.files.create({
        requestBody: { name: `product-${Date.now()}-${file.name}`, mimeType: file.type, ...(folderId ? { parents: [folderId] } : {}) },
        media: { mimeType: file.type, body: Readable.from(buffer) },
        fields: "id",
      });
      const id = uploaded.data.id;
      if (!id) throw new Error("Google Drive did not return an image ID");
      await drive.permissions.create({ fileId: id, requestBody: { type: "anyone", role: "reader" } });
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }));
    urls.push(...uploadedUrls);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Product image upload failed", error);
    return NextResponse.json({ error: "Unable to upload images." }, { status: 500 });
  }
}
