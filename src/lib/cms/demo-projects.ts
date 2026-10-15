import type { ArchiveProject } from "@/content/projects";

/**
 * Development only (`/he/projects?demo=1`, never in production): placeholder
 * cards so the grid layouts, filters and featured slots can be checked with
 * more than the few published projects. Every title is marked "דמו" (demo).
 */
export const demoEnabled = (flag?: string) =>
  process.env.NODE_ENV !== "production" && flag === "1";

const demoCategories = [
  { slug: "demo-websites", name: "אתרים" },
  { slug: "demo-products", name: "מוצרים דיגיטליים" },
  { slug: "demo-platforms", name: "פלטפורמות" },
  { slug: "demo-automations", name: "אוטומציות" },
];

const media = {
  garden: { src: "/images/advantages-garden.webp", alt: "" },
  wordmark: { src: "/images/footer/wordmark-fill.webp", alt: "" },
  disco: { src: "/party-mode/disco-ball.webp", alt: "" },
  showreel: {
    src: "/videos/hero-showreel.mp4",
    poster: "/videos/hero-showreel-poster.jpg",
  },
};

type Seed = {
  title: string;
  image?: keyof typeof media;
  featured?: boolean;
  linked?: boolean;
  categories: number[];
  services: string[];
  description?: string;
};

const seeds: Seed[] = [
  {
    title: "דמו · מערכת הזמנות",
    image: "showreel",
    featured: true,
    categories: [1, 2],
    services: ["איפיון", "עיצוב UI", "פיתוח Next.js"],
    description:
      "תיאור דמו באורך של שתי שורות, כדי לבדוק איך שכבת המידע מתנהגת בכרטיס גדול.",
  },
  {
    title: "דמו · אתר תדמית",
    image: "garden",
    categories: [0],
    services: ["עיצוב", "פיתוח"],
  },
  {
    title: "דמו · דשבורד",
    categories: [1, 2],
    services: ["UX"],
    description: "כרטיס בלי תמונה.",
  },
  {
    title: "דמו · אוטומציה",
    image: "disco",
    categories: [3],
    services: ["אוטומציה", "AI"],
  },
  {
    title: "דמו · חנות",
    image: "wordmark",
    featured: true,
    categories: [0, 1],
    services: ["עיצוב", "Shopify"],
  },
  {
    title: "דמו · אפליקציה",
    image: "garden",
    linked: false,
    categories: [1],
    services: ["עיצוב מוצר"],
    description: "כרטיס ללא עמוד פרויקט (בלי קישור).",
  },
  {
    title: "דמו · פלטפורמת למידה",
    image: "showreel",
    categories: [2],
    services: ["פיתוח", "Supabase"],
  },
  {
    title: "דמו · דף נחיתה",
    image: "disco",
    categories: [0],
    services: ["עיצוב", "קופי"],
  },
  {
    title: "דמו · בוט שירות",
    image: "wordmark",
    categories: [3],
    services: ["AI", "אינטגרציות"],
  },
  {
    title: "דמו · מיתוג דיגיטלי",
    image: "garden",
    categories: [0, 1],
    services: ["עיצוב"],
  },
];

export function demoArchive(locale: string, href: string | null) {
  const projects: ArchiveProject[] = seeds.map((seed, i) => {
    const m = seed.image ? media[seed.image] : null;
    const video = m && "poster" in m ? { src: m.src, poster: m.poster } : null;
    return {
      id: `demo-${i}`,
      slug: null,
      href: seed.linked === false ? null : href,
      title: seed.title,
      description:
        seed.description ?? "תיאור דמו קצר לבדיקת שכבת המידע בכרטיס.",
      contribution: seed.services.join(" · "),
      image: video
        ? { src: video.poster, alt: seed.title }
        : m
          ? { src: m.src, alt: seed.title }
          : null,
      video,
      highlight: null,
      type: locale === "he" ? "דמו" : "Demo",
      details: [],
      categories: seed.categories.map((c) => ({
        id: demoCategories[c].slug,
        name: demoCategories[c].name,
      })),
      featured: Boolean(seed.featured),
      services: seed.services,
      year: 2026,
      categorySlugs: seed.categories.map((c) => demoCategories[c].slug),
    };
  });
  return { projects, categories: demoCategories };
}
