// Moriz Diagnostic lives under /digital-audit inside the Moriz website. The
// standalone app got that prefix from Next's `basePath`; the website cannot use
// one (it would move every site route), so the prefix is a real route folder,
// src/app/digital-audit/, and Next no longer adds it for us. Everything that
// builds a URL — <Link>, router.push, raw <a href>, fetch(), window.location,
// revalidatePath — must go through withBasePath so the prefix is explicit and
// greppable. usePathname() now returns the prefixed path; stripBasePath restores
// the prefix-less form the navigation logic was written against.
export const BASE_PATH = '/digital-audit';
export const withBasePath = (path: string): string => `${BASE_PATH}${path}`;
export const stripBasePath = (pathname: string): string =>
  pathname === BASE_PATH
    ? '/'
    : pathname.startsWith(`${BASE_PATH}/`)
      ? pathname.slice(BASE_PATH.length)
      : pathname;
