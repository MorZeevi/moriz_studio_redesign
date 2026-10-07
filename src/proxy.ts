import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale } from "@/i18n/config";

export function proxy(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = `/${defaultLocale}`;
  return NextResponse.redirect(destination);
}

// Only the entry URL is redirected. Assets and future routes are unaffected.
export const config = { matcher: "/" };
