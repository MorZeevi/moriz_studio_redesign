import {
  CONTACT_MAX_BODY_LENGTH,
  parseContactSubmission,
  sendContactEmail,
} from "@/lib/contact-email";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return Response.json({ error: "forbidden" }, { status: 403, headers });
    }
    if (!host || originHost !== host)
      return Response.json({ error: "forbidden" }, { status: 403, headers });
  }

  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "invalid_body" }, { status: 415, headers });

  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > CONTACT_MAX_BODY_LENGTH)
    return Response.json({ error: "invalid_body" }, { status: 413, headers });

  const text = await request.text().catch(() => "");
  if (!text || text.length > CONTACT_MAX_BODY_LENGTH)
    return Response.json({ error: "invalid_body" }, { status: 413, headers });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400, headers });
  }
  const submission = parseContactSubmission(body);
  if (!submission)
    return Response.json({ error: "invalid_fields" }, { status: 400, headers });

  // A hidden field catches simple form spam without exposing provider details.
  if (submission.website) return Response.json({ ok: true }, { headers });

  const appPassword = process.env.CONTACT_GMAIL_APP_PASSWORD?.replace(
    /\s/g,
    "",
  );
  if (!appPassword) {
    console.error("[contact] Gmail app password is not configured");
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }

  try {
    const accepted = await sendContactEmail(submission, appPassword);
    if (!accepted) {
      console.error("[contact] Gmail did not accept the recipient");
      return Response.json({ error: "send_failed" }, { status: 502, headers });
    }
    return Response.json({ ok: true }, { headers });
  } catch {
    console.error("[contact] Gmail SMTP request failed");
    return Response.json({ error: "send_failed" }, { status: 502, headers });
  }
}
