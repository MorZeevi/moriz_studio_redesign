import { NextResponse } from 'next/server';
import { personalizeSession } from '@/diagnostic/ai/personalizeService';
import { validateSessionIdPayload } from '@/diagnostic/validation';
import type { PersonalizeRes } from '@/diagnostic/api-types';

export const runtime = 'nodejs';
// AI is already bounded server-side (~8s AI_TIMEOUT_MS via AbortController);
// this is an explicit ceiling for the platform. Well under the 300s plan default.
export const maxDuration = 30;

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
    const outcome = await personalizeSession(validated.value.sessionId);

    switch (outcome.status) {
      case 'session_not_found':
        return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
      case 'missing_required_answers':
        return NextResponse.json(
          { error: 'missing_required_answers', missing: outcome.missing },
          { status: 409 }
        );
      case 'generated': {
        const res: PersonalizeRes = { personalization: outcome.copy };
        return NextResponse.json(res, { status: 200 });
      }
      case 'fallback': {
        const res: PersonalizeRes = { personalization: null, reason: outcome.reason };
        return NextResponse.json(res, { status: 200 });
      }
    }
  } catch (err) {
    console.error('POST /api/diagnostic/personalize failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
