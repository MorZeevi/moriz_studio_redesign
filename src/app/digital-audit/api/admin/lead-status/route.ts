import { NextResponse } from 'next/server.js';
import { revalidatePath } from 'next/cache.js';

import { isAdminJsonRequest } from '../../../../../diagnostic/adminRequestAuth.ts';
import type { StatusUpdateReq } from '../../../../../diagnostic/api-types.ts';
import { withBasePath } from '../../../../../diagnostic/basePath.ts';
import {
  handleStatusUpdate,
  validateStatusUpdatePayload,
  type StatusUpdateOutcome,
} from '../../../../../diagnostic/leadStatusService.ts';

export const runtime = 'nodejs';

interface LeadStatusPostDeps {
  isAuthorized: (request: Request) => Promise<boolean>;
  handleStatusUpdate: (req: StatusUpdateReq) => Promise<StatusUpdateOutcome>;
  revalidate: (path: string) => void;
}

const defaultDeps: LeadStatusPostDeps = {
  isAuthorized: isAdminJsonRequest,
  handleStatusUpdate: (req) => handleStatusUpdate(req),
  revalidate: (path) => revalidatePath(path),
};

// Admin-only (P9f). Guard runs before the body is even read; a failed guard
// answers 404 (not 401/403) so the route's existence is never revealed.
export function createLeadStatusPostHandler(deps: LeadStatusPostDeps = defaultDeps) {
  return async function leadStatusPost(request: Request) {
    if (!(await deps.isAuthorized(request))) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = JSON.parse(await request.text());
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const validated = validateStatusUpdatePayload(body);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    try {
      const outcome = await deps.handleStatusUpdate(validated.value);
      switch (outcome.status) {
        case 'session_not_found':
          return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
        case 'updated':
          // ponytail: inert today — getLeadsForQueue is an uncached direct query on a
          // dynamic route, so there is no server cache to bust. Kept as the server half
          // of the invalidation, load-bearing the moment that query gains unstable_cache.
          // The actual back-nav fix is client-side AdminQueueRefresh (router.refresh).
          deps.revalidate(withBasePath('/admin'));
          return NextResponse.json({ ok: true });
      }
    } catch (err) {
      console.error('POST /api/admin/lead-status failed', err);
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
  };
}

export const POST = createLeadStatusPostHandler();
