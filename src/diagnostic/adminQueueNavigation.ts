export function shouldRefreshAdminQueue(previousPath: string, currentPath: string): boolean {
  return previousPath.startsWith('/admin/leads/') && currentPath === '/admin';
}
