import type { Category } from "@/types/project";
import styles from "./category-tags.module.css";
export function CategoryTags({
  categories,
}: {
  categories: Pick<Category, "id" | "name">[];
}) {
  if (!categories.length) return null;
  return (
    <ul className={styles.tags} aria-label="קטגוריות">
      {categories.map((category) => (
        <li className={styles.tag} key={category.id}>
          {category.name}
        </li>
      ))}
    </ul>
  );
}
