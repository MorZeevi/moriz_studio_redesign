import { NextResponse } from 'next/server';
import { insertDiagnosticEvent } from '@/diagnostic/db/mutations';
import { validateEventPayload } from '@/diagnostic/validation';
import type { EventRes } from '@/diagnostic/api-types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = validateEventPayload(body);
  if (!validated.valid) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    await insertDiagnosticEvent(validated.value);
    const res: EventRes = { ok: true };
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    console.error('POST /api/diagnostic/events failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
