import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // English content is not enabled in the redesign yet. Permanent, so
      // search engines move the previous site's /en ranking to Hebrew pages.
      { source: "/en", destination: "/he", permanent: true },
      { source: "/en/:path+", destination: "/he/:path+", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/:locale/articles/:slug",
        has: [{ type: "query", key: "preview", value: "1" }],
        destination: "/:locale/articles/preview/:slug",
      },
    ];
  },
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./content/articles/**/*.mdx"],
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
    ],
  },
});

export default withMDX(nextConfig);
