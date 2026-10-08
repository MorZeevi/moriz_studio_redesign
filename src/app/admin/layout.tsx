import type { Metadata } from "next";
import { danidin, leon } from "@/styles/fonts";
import "../globals.css";
import styles from "@/components/admin/admin.module.css";
export const metadata: Metadata = {
  title: "ניהול תיק עבודות | Moriz Studio",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${danidin.variable} ${leon.variable}`}
    >
      <body>
        <div className={styles.shell}>{children}</div>
      </body>
    </html>
  );
}
