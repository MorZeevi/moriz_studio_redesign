import type { Category } from "@/types/project";
import styles from "./category-tags.module.css";
export function CategoryTags({
  categories,
  label = "קטגוריות",
}: {
  categories: Pick<Category, "id" | "name">[];
  label?: string;
}) {
  if (!categories.length) return null;
  return (
    <ul className={styles.tags} aria-label={label}>
      {categories.map((category) => (
        <li className={styles.tag} key={category.id}>
          {category.name}
        </li>
      ))}
    </ul>
  );
}
