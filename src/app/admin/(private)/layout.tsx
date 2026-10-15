import Link from "next/link";
import { requireAdmin } from "@/lib/cms/auth";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import styles from "@/components/admin/admin.module.css";
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <header className={styles.header}>
        <Link href="/admin/projects">Moriz Studio — ניהול</Link>
        <nav aria-label="ניהול">
          <Link href="/admin/projects">פרויקטים</Link>
          <Link href="/admin/categories">קטגוריות</Link>
          <Link href="/he">לאתר</Link>
        </nav>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">
            יציאה
          </Button>
        </form>
      </header>
      {children}
    </>
  );
}
