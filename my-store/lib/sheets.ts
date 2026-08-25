import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

let spreadsheetPromise: Promise<GoogleSpreadsheet> | null = null;

export async function getSpreadsheet() {
  if (spreadsheetPromise) return spreadsheetPromise;

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !email || !privateKey) {
    throw new Error("Missing Google Sheets environment variables");
  }

  spreadsheetPromise = (async () => {
    const auth = new JWT({
      email,
      key: privateKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();
    return doc;
  })();

  try {
    return await spreadsheetPromise;
  } catch (error) {
    spreadsheetPromise = null;
    throw error;
  }
}

export async function getSheet() {
  const doc = await getSpreadsheet();
  return doc.sheetsByIndex[0];
}