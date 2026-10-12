import { NextResponse } from 'next/server';
import { resolveDiagnosticResult } from '@/diagnostic/resultService';
import { validateSessionIdPayload } from '@/diagnostic/validation';
import type { ResultRes } from '@/diagnostic/api-types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = validateSessionIdPayload(body);
  if (!validated.valid) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const { sessionId } = validated.value;
    const resolved = await resolveDiagnosticResult(sessionId);
    if (resolved.status === 'not_found') {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
    }
    if (resolved.status === 'incomplete') {
      return NextResponse.json(
        { error: 'missing_required_answers', missing: resolved.missing },
        { status: 409 }
      );
    }

    const res: ResultRes = { result: resolved.result };
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    console.error('POST /api/diagnostic/result failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
