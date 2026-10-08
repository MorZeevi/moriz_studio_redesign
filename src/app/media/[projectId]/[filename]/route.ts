import { supabaseConfig } from "@/lib/supabase/config";
import { serverSupabase } from "@/lib/supabase/server";
import { UUID } from "@/lib/cms/validation";

type Params = { params: Promise<{ projectId: string; filename: string }> };
export async function GET(request: Request, { params }: Params) {
  const { projectId, filename } = await params;
  if (
    !UUID.test(projectId) ||
    !/^([0-9a-f-]{36})\.(jpg|png|webp|avif|gif|mp4|webm)$/i.test(filename) ||
    !UUID.test(filename.slice(0, 36))
  )
    return new Response(null, { status: 404 });
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
  const range = request.headers.get("range");
  if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
  const upstream = await fetch(
    `${url}/storage/v1/object/project-media/${projectId}/${filename}`,
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
  return new Response(upstream.body, {
    status: upstream.status,
    headers: outgoing,
  });
}
