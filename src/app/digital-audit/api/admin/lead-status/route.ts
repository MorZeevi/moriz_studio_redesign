import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withBasePath } from '@/diagnostic/basePath';

import {
  handleStatusUpdate,
  isAdminSecretValid,
  validateStatusUpdatePayload,
} from '@/diagnostic/leadStatusService';

export const runtime = 'nodejs';

// Admin-only (P9f). Guard runs before the body is even read; a failed guard
// answers 404 (not 401/403) so the route's existence is never revealed.
export async function POST(request: Request) {
  if (!isAdminSecretValid(request.headers.get('x-admin-secret'))) {
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
    const outcome = await handleStatusUpdate(validated.value);
    switch (outcome.status) {
      case 'session_not_found':
        return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
      case 'updated':
        // ponytail: inert today — getLeadsForQueue is an uncached direct query on a
        // dynamic route, so there is no server cache to bust. Kept as the server half
        // of the invalidation, load-bearing the moment that query gains unstable_cache.
        // The actual back-nav fix is client-side AdminQueueRefresh (router.refresh).
        revalidatePath(withBasePath('/admin'));
        return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error('POST /api/admin/lead-status failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
