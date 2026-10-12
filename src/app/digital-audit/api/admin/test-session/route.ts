import { NextResponse } from 'next/server.js';

import type { AdminTestSessionRes } from '../../../../../diagnostic/api-types.ts';
import {
  createAdminTestSession,
  isAdminSecretValid,
  validateAdminTestSessionPayload,
} from '../../../../../diagnostic/sessionClassificationService.ts';

export const runtime = 'nodejs';

interface TestSessionPostDeps {
  isAdminSecretValid: (header: string | null) => boolean;
  createAdminTestSession: () => Promise<AdminTestSessionRes>;
}

const defaultDeps: TestSessionPostDeps = {
  isAdminSecretValid,
  createAdminTestSession,
};

export function createTestSessionPostHandler(deps: TestSessionPostDeps = defaultDeps) {
  return async function testSessionPost(request: Request) {
    if (!deps.isAdminSecretValid(request.headers.get('x-admin-secret'))) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const validated = validateAdminTestSessionPayload(body);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    try {
      const response: AdminTestSessionRes = await deps.createAdminTestSession();
      return NextResponse.json(response);
    } catch (err) {
      console.error('POST /api/admin/test-session failed', err);
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
  };
}

export const POST = createTestSessionPostHandler();
