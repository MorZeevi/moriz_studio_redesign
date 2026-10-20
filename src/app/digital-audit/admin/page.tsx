import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeadsForQueue, getTestLeadsForQueue } from '@/diagnostic/db/queries';
import { SOURCE_LABELS_HE } from '@/diagnostic/diagnosticSource';
import { isLeadStatus, STATUS_LABELS_HE, URGENCY_LABELS_HE, type LeadStatus } from '@/diagnostic/leadStatus';
import { deriveUrgency } from '@/diagnostic/urgency';
import { isSortDir, isSortKey, sortLeadRows, type SortKey } from '@/diagnostic/leadSort';
import {
  buildAdminDetailHref,
  buildAdminQueueHref,
  buildAdminSortHref,
  resolveLeadQueueView,
} from '@/diagnostic/leadQueueView';
import { withBasePath } from '@/diagnostic/basePath';
import StartTestSessionControl from './StartTestSessionControl';
import styles from './page.module.css';

const STATUS_BADGE_CLASS: Record<LeadStatus, string> = {
  new: styles.badgeNew,
  in_review: styles.badgeInReview,
  contacted: styles.badgeContacted,
  closed: styles.badgeClosed,
};

const TIER_BADGE_CLASS: Record<'A' | 'B' | 'C', string> = {
  A: styles.tierBadgeA,
  B: styles.tierBadgeB,
  C: styles.tierBadgeC,
};

const RTF_HE = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function relativeHe(iso: string, now: number): string {
  const diffMs = new Date(iso).getTime() - now;
  const abs = Math.abs(diffMs);
  if (abs < MINUTE_MS) return RTF_HE.format(0, 'minute');
  if (abs < HOUR_MS) return RTF_HE.format(Math.round(diffMs / MINUTE_MS), 'minute');
  if (abs < DAY_MS) return RTF_HE.format(Math.round(diffMs / HOUR_MS), 'hour');
  return RTF_HE.format(Math.round(diffMs / DAY_MS), 'day');
}

// ponytail: env-secret guard, replace with real auth before prod lead review.
// Secret-in-query leaks via logs; acceptable only for local/dev (design doc §12).
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string; sort?: string; dir?: string; view?: string }>;
}) {
  const { secret, sort, dir, view: rawView } = await searchParams;
  const expected = process.env.ADMIN_ACCESS_SECRET;
  if (!expected || !secret || secret !== expected) {
    notFound();
  }

  const view = resolveLeadQueueView(rawView);

  // ponytail: server component, one now() per request — shared by sort and
  // every row's urgency/relative-date derivation so a single render is consistent.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  // Both queries are pinned to this deployment's own source in the data layer.
  const rawLeads = view === 'test' ? await getTestLeadsForQueue() : await getLeadsForQueue();
  // ponytail: DB status is constrained to the four known values (CHECK
  // constraint); this guard exists only so the type-checker can prove it —
  // the 'new' fallback is never expected to trigger in practice.
  const leads = rawLeads.map((lead) => ({
    ...lead,
    status: isLeadStatus(lead.status) ? lead.status : ('new' as LeadStatus),
  }));

  const currentDir: 'asc' | 'desc' = isSortDir(dir) ? dir : 'desc';
  const currentSort = isSortKey(sort) ? sort : undefined;
  const sortedLeads = sortLeadRows(leads, now, currentSort, currentDir);

  // Nested functions don't inherit the guard's narrowing of `secret` above
  // (TS widens closures back to the declared type), so rebind explicitly.
  const safeSecret: string = secret;
  const navigation = { secret: safeSecret, view, sort: currentSort, dir: currentDir };

  function sortHref(key: SortKey): string {
    return buildAdminSortHref(navigation, key);
  }

  function detailHref(sessionId: string): string {
    return buildAdminDetailHref(sessionId, navigation);
  }

  function sortHeaderCell(key: SortKey, label: string) {
    const active = currentSort === key;
    return (
      <th aria-sort={active ? (currentDir === 'asc' ? 'ascending' : 'descending') : undefined}>
        <a
          className={`${styles.sortHeaderLink} ${active ? styles.sortHeaderLinkActive : ''}`}
          href={withBasePath(sortHref(key))}
        >
          {label}
          {active && (
            <span className={styles.sortIndicator} aria-hidden="true">
              {currentDir === 'desc' ? '▼' : '▲'}
            </span>
          )}
        </a>
      </th>
    );
  }

  return (
    <main dir="rtl" className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.shellHeader}>
          <div className={styles.headerBar}>
            <span className={styles.brand}>MORIZ STUDIO</span>
            <span className={styles.contextLabel}>ניהול לידים</span>
          </div>
          <h1>{view === 'test' ? 'נתוני בדיקה מהאבחון' : 'לידים מהאבחון הדיגיטלי'}</h1>
        </header>

        <nav className={styles.viewTabs} aria-label="סוג נתוני הלידים">
          <Link
            className={`${styles.viewTab} ${view === 'real' ? styles.viewTabActive : ''}`}
            href={withBasePath(buildAdminQueueHref({ ...navigation, view: 'real' }))}
            aria-current={view === 'real' ? 'page' : undefined}
          >
            לידים אמיתיים
          </Link>
          <Link
            className={`${styles.viewTab} ${view === 'test' ? styles.viewTabActive : ''}`}
            href={withBasePath(buildAdminQueueHref({ ...navigation, view: 'test' }))}
            aria-current={view === 'test' ? 'page' : undefined}
          >
            נתוני בדיקה
          </Link>
        </nav>

        {view === 'test' && (
          <section className={styles.testToolbar} aria-label="כלי בדיקה">
            <div>
              <strong>מצב נתוני בדיקה</strong>
              <p>המסעות ברשימה הזו אינם נכללים בנתוני הייצור.</p>
            </div>
            <StartTestSessionControl secret={safeSecret} />
          </section>
        )}

        {sortedLeads.length === 0 ? (
          <p className={styles.status}>
            {view === 'test' ? 'אין עדיין לידים שסווגו כנתוני בדיקה.' : 'אין עדיין לידים.'}
          </p>
        ) : (
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: kept verbatim from the standalone app
          <div
            className={styles.tableScroll}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable table region must stay keyboard-focusable (kept verbatim from the standalone app)
            tabIndex={0}
            aria-label="רשימת לידים"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  {sortHeaderCell('created', 'נוצר')}
                  {sortHeaderCell('status', 'סטטוס')}
                  {sortHeaderCell('urgency', 'דחיפות')}
                  <th>שם</th>
                  <th>פרטי קשר</th>
                  <th>פתרון מוביל</th>
                  {sortHeaderCell('grade', 'דירוג ליד')}
                  <th>בעלים</th>
                  <th>מקור</th>
                  <th>הודעה</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead) => {
                  const utm = [lead.utmSource, lead.utmCampaign].filter(Boolean).join(' / ');
                  const message =
                    lead.message && lead.message.length > 60 ? `${lead.message.slice(0, 60)}…` : lead.message;
                  const urgency = deriveUrgency(lead.createdAt, lead.status, now);
                  return (
                    <tr key={lead.sessionId}>
                      <td>
                        <span title={new Date(lead.createdAt).toLocaleString('en-GB')}>
                          {relativeHe(lead.createdAt, now)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[lead.status]}`}>
                          {STATUS_LABELS_HE[lead.status]}
                        </span>
                      </td>
                      <td>
                        {urgency === 'urgent' || urgency === 'aging' ? (
                          <span
                            className={`${styles.urgencyPill} ${urgency === 'urgent' ? styles.urgencyUrgent : styles.urgencyAging}`}
                          >
                            {URGENCY_LABELS_HE[urgency]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <Link className={styles.leadLink} href={withBasePath(detailHref(lead.sessionId))}>
                          {lead.fullName}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.contact}>
                          <span dir="ltr">{lead.email || '—'}</span>
                          <span dir="ltr">{lead.phone}</span>
                        </div>
                      </td>
                      <td>{lead.resultTitle ?? lead.primarySolution ?? '—'}</td>
                      <td>
                        {lead.leadTier ? (
                          <span className={`${styles.tierBadge} ${TIER_BADGE_CLASS[lead.leadTier]}`}>
                            {lead.leadTier}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{SOURCE_LABELS_HE[lead.source]}</td>
                      <td>
                        <span dir="ltr">{utm || '—'}</span>
                      </td>
                      <td>{message ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
