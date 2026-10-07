import localFont from "next/font/local";

// One loader per family. Danidin + Leon are the shared foundations;
// other candidates remain available in the comparison utility.
export const danidin = localFont({
  src: "../assets/fonts/Danidin-CondensedBold.woff2",
  weight: "700",
  variable: "--font-danidin-bold",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const leon = localFont({
  src: [
    {
      path: "../assets/fonts/Leon-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/Leon-Heavy.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-leon",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
