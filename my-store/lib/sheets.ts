import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

export async function getSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !email || !privateKey) {
    throw new Error("Missing Google Sheets environment variables");
  }

  const auth = new JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const doc = new GoogleSpreadsheet(spreadsheetId, auth);

  await doc.loadInfo();
  return doc.sheetsByIndex[0];
}