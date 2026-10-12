import { NextResponse } from 'next/server';
import { createDiagnosticSession } from '@/diagnostic/db/mutations';
import { validateSessionCreatePayload } from '@/diagnostic/validation';
import type { SessionCreateRes } from '@/diagnostic/api-types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let rawBody: unknown = {};
  try {
    const text = await request.text();
    if (text) rawBody = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = validateSessionCreatePayload(rawBody);
  if (!validated.valid) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const { sessionId, startedAt } = await createDiagnosticSession(validated.value.utm);
    const res: SessionCreateRes = { sessionId, startedAt };
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    console.error('POST /api/diagnostic/session failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
