import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // English content is not enabled in the redesign yet. Permanent, so
      // search engines move the previous site's /en ranking to Hebrew pages.
      { source: "/en", destination: "/he", permanent: true },
      { source: "/en/:path+", destination: "/he/:path+", permanent: true },
    ];
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

export default nextConfig;
