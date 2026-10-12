import { NextResponse } from 'next/server';

import {
  handleLeadBrief,
  isAdminSecretValid,
  validateLeadBriefPayload,
} from '@/diagnostic/leadBriefService';

export const runtime = 'nodejs';

// Admin-only (P8a). Guard runs before the body is even read; a failed guard
// answers 404 (not 401/403) so the route's existence is never revealed.
export async function POST(request: Request) {
  if (!isAdminSecretValid(request.headers.get('x-admin-secret'))) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = validateLeadBriefPayload(body);
  if (!validated.valid) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const outcome = await handleLeadBrief(validated.value);
    switch (outcome.status) {
      case 'session_not_found':
        return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
      case 'brief_not_found':
        return NextResponse.json({ error: 'brief_not_found' }, { status: 404 });
      case 'saved':
        return NextResponse.json({ ok: true, brief: outcome.brief });
      case 'ai_failed':
        // Provider-path failures are a typed 200, never a 5xx (§C.3).
        return NextResponse.json({ ok: false, reason: outcome.reason });
    }
  } catch (err) {
    console.error('POST /api/admin/lead-brief failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
