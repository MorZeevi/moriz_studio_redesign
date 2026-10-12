'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { shouldRefreshAdminQueue } from '@/diagnostic/adminQueueNavigation';
import { stripBasePath, withBasePath } from '@/diagnostic/basePath';

export default function AdminQueueRefresh() {
  // Without a Next basePath, usePathname() carries /digital-audit; the refresh
  // rule compares prefix-less admin paths.
  const pathname = stripBasePath(usePathname());
  const router = useRouter();
  const previousPath = useRef(pathname);

  // Soft-nav case: detail -> /admin transition inside the live SPA document.
  useEffect(() => {
    const shouldRefresh = shouldRefreshAdminQueue(previousPath.current, pathname);
    previousPath.current = pathname;

    if (shouldRefresh) {
      router.refresh();
    }
  }, [pathname, router]);

  // BFCache case: a full-document nav to a lead (e.g. a pre-hydration <Link>
  // fallback to a hard GET) unloads /admin into the browser back/forward cache.
  // Back restores that frozen (stale) document without re-mounting React, so the
  // soft-nav effect above never runs. pageshow(persisted) is the only restore
  // signal. We hard-reload rather than router.refresh(): Next's own persisted-
  // pageshow listener dispatches ACTION_RESTORE, which discards a competing
  // refresh action (app-router-instance.js) — reload bypasses the router action
  // queue entirely and is guaranteed-fresh. The reload's own pageshow fires with
  // persisted=false, so no loop. Gated to the queue so restoring a detail is
  // left alone.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && window.location.pathname === withBasePath('/admin')) {
        window.location.reload();
      }
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  return null;
}
