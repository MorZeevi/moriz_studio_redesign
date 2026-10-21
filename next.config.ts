import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Keep the existing policy accessible while the new legal pages are prepared.
      {
        source: "/:locale(he|en)/privacy-policy",
        destination: "https://moriz-studio-8.vercel.app/:locale/privacy-policy",
        permanent: false,
      },
      // English content is not enabled in the redesign yet.
      { source: "/en", destination: "/he", permanent: false },
      { source: "/en/:path+", destination: "/he/:path+", permanent: false },
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
