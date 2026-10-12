import { NextResponse } from 'next/server.js';

import type { SessionClassificationReq, SessionClassificationRes } from '../../../../../diagnostic/api-types.ts';
import {
  handleSessionClassification,
  isAdminSecretValid,
  validateSessionClassificationPayload,
} from '../../../../../diagnostic/sessionClassificationService.ts';

export const runtime = 'nodejs';

interface SessionClassificationPostDeps {
  isAdminSecretValid: (header: string | null) => boolean;
  handleSessionClassification: (
    req: SessionClassificationReq,
  ) => Promise<{ isTest: boolean } | null>;
}

const defaultDeps: SessionClassificationPostDeps = {
  isAdminSecretValid,
  handleSessionClassification,
};

export function createSessionClassificationPostHandler(deps: SessionClassificationPostDeps = defaultDeps) {
  return async function sessionClassificationPost(request: Request) {
    if (!deps.isAdminSecretValid(request.headers.get('x-admin-secret'))) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = JSON.parse(await request.text());
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const validated = validateSessionClassificationPayload(body);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    try {
      const outcome = await deps.handleSessionClassification(validated.value);
      if (!outcome) {
        return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
      }
      const response: SessionClassificationRes = { ok: true, isTest: outcome.isTest };
      return NextResponse.json(response);
    } catch (err) {
      console.error('POST /api/admin/session-classification failed', err);
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
  };
}

export const POST = createSessionClassificationPostHandler();
