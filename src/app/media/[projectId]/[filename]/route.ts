import { parseMediaWidth } from "@/lib/media-variants";
import { supabaseConfig } from "@/lib/supabase/config";
import { serverSupabase } from "@/lib/supabase/server";
import { CMS_MEDIA_BUCKET } from "@/lib/cms/source";
import { MEDIA_FILE, UUID } from "@/lib/cms/validation";

type Params = { params: Promise<{ projectId: string; filename: string }> };
export async function GET(request: Request, { params }: Params) {
  const { projectId, filename } = await params;
  if (
    !UUID.test(projectId) ||
    !MEDIA_FILE.test(filename) ||
    !UUID.test(filename.slice(0, 36))
  )
    return new Response(null, { status: 404 });
  let width: number | null;
  try {
    width = parseMediaWidth(new URL(request.url).searchParams.get("w"));
  } catch {
    return new Response(null, {
      status: 400,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  if (width && !/\.(png|jpe?g|webp|avif)$/i.test(filename))
    return new Response(null, {
      status: 400,
      headers: { "Cache-Control": "private, no-store" },
    });
  const { url, key } = supabaseConfig();
  const client = await serverSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  let token = key;
  if (user && user.id === process.env.SUPABASE_ADMIN_USER_ID) {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session) token = session.access_token;
  }
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${token}`,
  };
  if (width) headers.Accept = "image/webp";
  const range = width ? null : request.headers.get("range");
  if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
  const upstream = await fetch(
    width
      ? `${url}/storage/v1/render/image/authenticated/${CMS_MEDIA_BUCKET}/${projectId}/${filename}?width=${width}&quality=80&resize=contain`
      : `${url}/storage/v1/object/${CMS_MEDIA_BUCKET}/${projectId}/${filename}`,
    { headers, cache: "no-store", signal: request.signal },
  );
  if (!upstream.ok)
    return new Response(null, {
      status: upstream.status === 416 ? 416 : 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  const outgoing = new Headers({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  for (const header of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ]) {
    const value = upstream.headers.get(header);
    if (value) outgoing.set(header, value);
  }
  if (filename.toLowerCase().endsWith(".svg")) {
    // Logos may be SVG: opened directly, the file must never run script.
    outgoing.set("content-type", "image/svg+xml");
    outgoing.set(
      "Content-Security-Policy",
      "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    );
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: outgoing,
  });
}
