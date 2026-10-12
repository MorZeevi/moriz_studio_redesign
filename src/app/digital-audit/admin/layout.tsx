import type { ReactNode } from 'react';

import AdminQueueRefresh from './AdminQueueRefresh';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminQueueRefresh />
      {children}
    </>
  );
}
