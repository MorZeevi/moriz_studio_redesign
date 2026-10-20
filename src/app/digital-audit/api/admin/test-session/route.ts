import { NextResponse } from 'next/server.js';

import { isAdminJsonRequest } from '../../../../../diagnostic/adminRequestAuth.ts';
import type { AdminTestSessionRes } from '../../../../../diagnostic/api-types.ts';
import {
  createAdminTestSession,
  validateAdminTestSessionPayload,
} from '../../../../../diagnostic/sessionClassificationService.ts';

export const runtime = 'nodejs';

interface TestSessionPostDeps {
  isAuthorized: (request: Request) => Promise<boolean>;
  createAdminTestSession: () => Promise<AdminTestSessionRes>;
}

const defaultDeps: TestSessionPostDeps = {
  isAuthorized: isAdminJsonRequest,
  createAdminTestSession,
};

export function createTestSessionPostHandler(deps: TestSessionPostDeps = defaultDeps) {
  return async function testSessionPost(request: Request) {
    // Owner session + same-origin + JSON, before the body is read. A failure
    // answers 404 so the route's existence is never revealed.
    if (!(await deps.isAuthorized(request))) {
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
