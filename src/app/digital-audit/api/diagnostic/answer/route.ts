import { NextResponse } from 'next/server';
import { resolveAnswerSave } from '@/diagnostic/answerService';
import { validateAnswerPayload } from '@/diagnostic/validation';
import type { AnswerRes } from '@/diagnostic/api-types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = validateAnswerPayload(body);
  if (!validated.valid) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const outcome = await resolveAnswerSave(
      validated.value.sessionId,
      validated.value.questionId,
      validated.value.answer
    );
    if (outcome.status === 'not_found') {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
    }
    if (outcome.status === 'result_finalized') {
      return NextResponse.json({ error: 'result_finalized' }, { status: 409 });
    }

    const res: AnswerRes = { ok: true };
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    console.error('POST /api/diagnostic/answer failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
