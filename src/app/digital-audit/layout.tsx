import type { Metadata } from "next";
import "./diagnostic.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://moriz.studio"),
  title: "אבחון דיגיטלי | Moriz Studio",
  description:
    "אבחון דיגיטלי קצר שיעזור לזהות את הכלי והפתרון המתאימים לצרכים שלכם.",
  icons: {
    icon: [{ url: "/digital-audit/favicon.ico?v=20260718", type: "image/x-icon" }],
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "Moriz Studio",
    title: "אבחון דיגיטלי | Moriz Studio",
    description:
      "אבחון דיגיטלי קצר שיעזור לזהות את הכלי והפתרון המתאימים לצרכים שלכם.",
    images: [
      {
        url: "/digital-audit/short_logo.png",
        width: 550,
        height: 550,
        alt: "Moriz Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "אבחון דיגיטלי | Moriz Studio",
    description:
      "אבחון דיגיטלי קצר שיעזור לזהות את הכלי והפתרון המתאימים לצרכים שלכם.",
    images: ["/digital-audit/short_logo.png"],
  },
  // R1 pre-launch: whole app (funnel + admin) noindex. Served at /digital-audit
  // from the src/app/digital-audit route folder of the Moriz website. Go-live SEO step (separate change): move
  // this noindex to app/admin/layout.tsx so the public funnel can be indexed
  // while /digital-audit/admin stays noindex. Do not flip in R1.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" data-diagnostic-app="">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
