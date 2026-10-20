// Pure so plain node can test it. The one identity rule for the admin surfaces:
// the signed-in Supabase user must be the configured owner. Fails closed when
// either side is missing.
export function isOwnerId(
  userId: string | null | undefined,
  ownerId: string | null | undefined,
): boolean {
  return Boolean(userId) && Boolean(ownerId) && userId === ownerId;
}
