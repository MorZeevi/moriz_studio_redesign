import path from "node:path";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// Turbopack resolves remark plugin strings from the MDX file's directory
// (content/articles), so a package name or a repo-root relative path misses.
const remarkInsertCta = path.join(
  process.cwd(),
  "src/lib/articles/remark-insert-cta.mjs",
);

const nextConfig: NextConfig = {
  // English lives at /en (src/i18n/config.ts). The earlier permanent
  // /en → /he redirects were removed when English launched; `/` still
  // redirects to /he in src/proxy.ts.
  async rewrites() {
    return [
      {
        source: "/:locale/articles/:slug",
        has: [{ type: "query", key: "preview", value: "1" }],
        destination: "/:locale/articles/preview/:slug",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "moriz.studio",
        pathname: "/media/**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./content/articles/**/*.mdx"],
    "/llms.txt": ["./content/articles/**/*.mdx"],
    "/[locale]/articles/rss.xml": ["./content/articles/**/*.mdx"],
  },
  // Keep Next's developer badge from covering the lower-side contact control.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.tsx": {
        condition: {
          all: [
            "development",
            { not: "foreign" },
            { path: /^(src|design-system\/(react|next))\// },
            { not: { path: /^src\/components\/devtools\// } },
          ],
        },
        loaders: ["./tools/devtools/source-loader.cjs"],
        // Preserve module paths: renaming TSX breaks RSC references in this Next version.
      },
    },
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-frontmatter",
      "remark-mdx-frontmatter",
      "remark-gfm",
      remarkInsertCta,
    ],
  },
});

export default withMDX(nextConfig);
