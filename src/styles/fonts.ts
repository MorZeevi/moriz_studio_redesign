import { Caveat } from "next/font/google";

// Danidin + Leon are the design-system kit's loaders (one next/font call each);
// other candidates remain available in the comparison utility.
export { danidin, leon } from "../../design-system/next/fonts";

// Handwriting for signatures (the design quote's author). Latin only, and not
// preloaded: it first shows far below the fold.
export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});
