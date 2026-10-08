import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms/auth";
export default async function Admin() {
  await requireAdmin();
  redirect("/admin/projects");
}
