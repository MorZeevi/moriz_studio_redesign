import localFont from "next/font/local";

// Earlier comparison candidates, not loaded by the shared locale layout.
export const futurism = localFont({
  preload: false,
  src: "../assets/fonts/Futurism-Black.woff2",
  weight: "900",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const manhattan = localFont({
  preload: false,
  src: "../assets/fonts/Manhattan-650.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const polin = localFont({
  preload: false,
  src: [
    {
      path: "../assets/fonts/Polin-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/Polin-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
