// Default authorizer for the cookie-authenticated admin API routes.
//
// The guard is imported lazily, inside the function: `test:diagnostic` loads the
// route files under plain node, where the "@/" alias and "server-only" do not
// resolve, so a static import would break every route test. Route tests inject
// their own `isAuthorized`.
export async function isAdminJsonRequest(request: Request): Promise<boolean> {
  const { isAdminRequest } = await import('@/lib/auth/admin');
  return isAdminRequest(request, { requireJson: true });
}
