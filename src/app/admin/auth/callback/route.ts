import { NextResponse } from "next/server";
export async function GET(request: Request) {
  // Old emailed links return to the password screen without creating a session.
  return NextResponse.redirect(new URL("/admin/login", request.url), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
