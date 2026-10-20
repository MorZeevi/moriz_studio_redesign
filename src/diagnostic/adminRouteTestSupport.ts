import { checkAdminRequest } from '../lib/auth/request-guards.ts';

// Shared by the admin route tests. The routes take an injected
// `isAuthorized(request)`; here it is the real request-level check (same-origin
// and JSON) with only the owner lookup faked, so the CSRF rules are exercised
// at route level without a Supabase session.

export const SITE_ORIGIN = 'http://localhost';

export function authorizerFor(isOwner: boolean, ownerLookups?: { count: number }) {
  return (request: Request) =>
    checkAdminRequest(request, { requireJson: true }, async () => {
      if (ownerLookups) ownerLookups.count += 1;
      return isOwner;
    });
}

/** A same-origin JSON POST, as the admin UI sends it. */
export function adminPost(path: string, body: string, headers: Record<string, string> = {}): Request {
  return new Request(`${SITE_ORIGIN}${path}`, {
    method: 'POST',
    headers: { origin: SITE_ORIGIN, 'content-type': 'application/json', ...headers },
    body,
  });
}

export interface RejectionCase {
  label: string;
  // Whether the owner session is valid for this request.
  owner: boolean;
  // Whether the owner lookup may be reached at all.
  mayLookUpOwner: boolean;
  build: (path: string) => Request;
}

const without = (headers: Record<string, string>, drop: string) => {
  const copy = { ...headers };
  delete copy[drop];
  return copy;
};
const base = { origin: SITE_ORIGIN, 'content-type': 'application/json' };
const post = (path: string, headers: Record<string, string>) =>
  new Request(`${SITE_ORIGIN}${path}`, { method: 'POST', headers, body: '{}' });

/** Every way a request must fail before the body is read; all answer 404. */
export const REJECTION_CASES: RejectionCase[] = [
  {
    label: 'no owner session',
    owner: false,
    mayLookUpOwner: true,
    build: (path) => post(path, base),
  },
  {
    label: 'the retired x-admin-secret header without a session',
    owner: false,
    mayLookUpOwner: true,
    build: (path) => post(path, { ...base, 'x-admin-secret': 'secret' }),
  },
  {
    label: 'a cross-origin request from the owner',
    owner: true,
    mayLookUpOwner: false,
    build: (path) => post(path, { ...base, origin: 'https://evil.example' }),
  },
  {
    label: 'a missing Origin header',
    owner: true,
    mayLookUpOwner: false,
    build: (path) => post(path, without(base, 'origin')),
  },
  {
    label: 'a null Origin',
    owner: true,
    mayLookUpOwner: false,
    build: (path) => post(path, { ...base, origin: 'null' }),
  },
  {
    label: 'a spoofed forwarded host',
    owner: true,
    mayLookUpOwner: false,
    build: (path) =>
      post(path, { ...base, origin: 'https://evil.example', 'x-forwarded-host': 'evil.example' }),
  },
  {
    label: 'a text/plain content type',
    owner: true,
    mayLookUpOwner: false,
    build: (path) => post(path, { ...base, 'content-type': 'text/plain' }),
  },
  {
    label: 'a missing content type',
    owner: true,
    mayLookUpOwner: false,
    build: (path) => post(path, without(base, 'content-type')),
  },
];

/**
 * Runs the handler over every rejection case and asserts a 404 not_found with
 * the body never read. The assertions use the caller's `assert`.
 */
export async function runRejectionCases(
  path: string,
  makeHandler: (isAuthorized: (request: Request) => Promise<boolean>) => (request: Request) => Promise<Response>,
  check: {
    equal: (actual: unknown, expected: unknown, message?: string) => void;
    deepEqual: (actual: unknown, expected: unknown, message?: string) => void;
  },
) {
  for (const testCase of REJECTION_CASES) {
    const lookups = { count: 0 };
    const handler = makeHandler(authorizerFor(testCase.owner, lookups));
    let bodyRead = false;
    const request = testCase.build(path);
    request.text = async () => {
      bodyRead = true;
      throw new Error('body must not be read');
    };

    const response = await handler(request);
    check.equal(response.status, 404, testCase.label);
    check.deepEqual(await response.json(), { error: 'not_found' }, testCase.label);
    check.equal(bodyRead, false, `${testCase.label}: body read`);
    if (!testCase.mayLookUpOwner) check.equal(lookups.count, 0, `${testCase.label}: owner looked up`);
  }
}
