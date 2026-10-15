import localFont from "next/font/local";

// next/font/local loaders for the kit's two families. Apply both variables
// once on <html>; css/tokens.css maps them to --font-display and --font-body.
export const danidin = localFont({
  src: "../fonts/Danidin-CondensedBold.woff2",
  weight: "700",
  variable: "--font-danidin-bold",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const leon = localFont({
  src: [
    { path: "../fonts/Leon-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Leon-Heavy.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-leon",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const fontVariables = `${danidin.variable} ${leon.variable}`;
