import { NextResponse } from 'next/server';
import { getDiagnosticLeadBySessionId, sessionExists } from '@/diagnostic/db/queries';
import { insertDiagnosticContact } from '@/diagnostic/db/mutations';
import { validateContactPayload } from '@/diagnostic/validation';
import { notifyNewLead } from '@/diagnostic/notify/leadNotifier';
import type { ContactRes } from '@/diagnostic/api-types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const validated = validateContactPayload(body);
  if (!validated.valid) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const exists = await sessionExists(validated.value.sessionId);
    if (!exists) {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
    }
    const inserted = await insertDiagnosticContact(validated.value);

    if (inserted) {
      // Never let a notify failure turn a persisted lead into a 500.
      try {
        const lead = await getDiagnosticLeadBySessionId(validated.value.sessionId);
        if (lead) await notifyNewLead(lead);
      } catch (err) {
        console.error('lead notify failed', err);
      }
    }

    const res: ContactRes = { ok: true, queued: true };
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    console.error('POST /api/diagnostic/contact failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
