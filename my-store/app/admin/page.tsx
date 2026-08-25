import { redirect } from "next/navigation";
import { isAdmin } from "../../lib/admin-auth";
import AdminPanel from "./panel";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminPanel />;
}
