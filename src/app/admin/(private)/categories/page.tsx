import { getAdminCategories } from "@/lib/cms/queries";
import { CategoryManager } from "@/components/admin/category-manager";
export default async function Categories() {
  return <CategoryManager initial={await getAdminCategories()} />;
}
