import { notFound } from 'next/navigation';

import { buildQuestionReadbackRows, getMatchedSignalLabelHe } from '@/diagnostic/questionReadback';
import { SOURCE_LABELS_HE } from '@/diagnostic/diagnosticSource';
import {
  getDiagnosticAnswers,
  getDiagnosticLeadBySessionId,
  getLeadBriefBySessionId,
  getSessionResultSnapshot,
} from '@/diagnostic/db/queries';
import { isValidUuid } from '@/diagnostic/validation';
import { isLeadStatus, type LeadStatus } from '@/diagnostic/leadStatus';
import { isSortDir, isSortKey } from '@/diagnostic/leadSort';
import { buildAdminDetailHref, buildAdminQueueHref, resolveLeadQueueView } from '@/diagnostic/leadQueueView';
import { withBasePath } from '@/diagnostic/basePath';
import { requireAdminPage } from '@/lib/auth/admin';
import LeadBriefPanel from './LeadBriefPanel';
import StatusControl from './StatusControl';
import TestClassificationControl from './TestClassificationControl';
import styles from './page.module.css';

// Reality side is never fabricated: a link that doesn't parse as a real URL
// means there is no auditable footprint and the audit is claim-only. Same
// parse rule as the public link validation (§C.5).
function hasAuditableLink(link: string | null): boolean {
  if (!link || link.trim().length === 0) return false;
  const trimmed = link.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

// Guarded by the owner's Supabase session, like the queue page.
export default async function AdminLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ sort?: string; dir?: string; view?: string }>;
}) {
  const { sort, dir, view: rawView } = await searchParams;
  const { sessionId } = await params;
  const view = resolveLeadQueueView(rawView);
  const currentSort = isSortKey(sort) ? sort : undefined;
  const currentDir = isSortDir(dir) ? dir : 'desc';
  const navigation = { view, sort: currentSort, dir: currentDir };
  await requireAdminPage(withBasePath(buildAdminDetailHref(sessionId, navigation)));
  const backHref = buildAdminQueueHref(navigation);

  // Non-uuid path segment would throw inside Supabase (uuid cast) → pre-check.
  if (!isValidUuid(sessionId)) {
    notFound();
  }

  const lead = await getDiagnosticLeadBySessionId(sessionId);
  if (!lead) {
    notFound();
  }

  const [answers, snapshot, brief] = await Promise.all([
    getDiagnosticAnswers(sessionId),
    getSessionResultSnapshot(sessionId),
    getLeadBriefBySessionId(sessionId),
  ]);

  const primarySignals = snapshot ? (snapshot.matchedSignals[snapshot.primarySolution] ?? []) : [];
  const auditable = hasAuditableLink(lead.link);
  // ponytail: DB status is constrained to the four known values (CHECK
  // constraint); this guard exists only so the type-checker can prove it.
  const initialStatus: LeadStatus = isLeadStatus(lead.status) ? lead.status : 'new';

  return (
    <main dir="rtl" className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.shellHeader}>
          <div className={styles.headerBar}>
            <span className={styles.brand}>MORIZ STUDIO</span>
            <a className={styles.backLink} href={withBasePath(backHref)}>
              חזרה ללידים
            </a>
          </div>
          <h1>{lead.fullName}</h1>
          <p className={styles.status}>
            בעלים: <strong>{SOURCE_LABELS_HE[lead.source]}</strong>
          </p>
        </header>

        {lead.isTest && (
          <aside className={styles.testBanner} aria-label="נתוני בדיקה">
            <span className={styles.testBadge}>בדיקה</span>
            <div>
              <strong>המסע הזה מסווג כנתוני בדיקה</strong>
              <p>האירועים שלו אינם נכללים בנתוני הייצור.</p>
            </div>
          </aside>
        )}

        {!auditable && (
          <p className={styles.flag}>אין נוכחות דיגיטלית לבדיקה. אבחון על בסיס הצהרה בלבד.</p>
        )}

        <section className={styles.section}>
          <h2>הצהרה (תשובות השאלון)</h2>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt>שם העסק</dt>
              <dd>{lead.businessName ?? 'לא צוין'}</dd>
            </div>
            <div className={styles.row}>
              <dt>קישור</dt>
              <dd>{lead.link ? <span dir="ltr">{lead.link}</span> : 'לא צוין'}</dd>
            </div>
            {buildQuestionReadbackRows(answers).map((r) => (
              <div key={r.questionId} className={styles.row}>
                <dt>{r.promptHe}</dt>
                <dd>{r.answerHe}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section}>
          <h2>תוצאת האבחון (דטרמיניסטית)</h2>
          {snapshot ? (
            <dl className={styles.list}>
              <div className={styles.row}>
                <dt>פתרון מוביל</dt>
                <dd>
                  {snapshot.resultTemplate?.titleHe ?? snapshot.primarySolution}{' '}
                  <span dir="ltr">({snapshot.primarySolution})</span>
                </dd>
              </div>
              {snapshot.secondarySolution && (
                <div className={styles.row}>
                  <dt>פתרון משני</dt>
                  <dd>{snapshot.secondarySolution}</dd>
                </div>
              )}
              <div className={styles.row}>
                <dt>ציוני איכות</dt>
                <dd>
                  <span dir="ltr">
                    pain {snapshot.painScore} / quality {snapshot.leadQualityScore} / tier {snapshot.leadTier}
                  </span>
                </dd>
              </div>
              {primarySignals.length > 0 && (
                <div className={styles.row}>
                  <dt>סיגנלים שנקלטו</dt>
                  <dd>
                    <ul className={styles.signals}>
                      {primarySignals.map((signal) => (
                        <li key={`${signal.questionId}:${signal.optionId}`}>
                          {getMatchedSignalLabelHe(signal)} <span dir="ltr">(+{signal.weight})</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className={styles.status}>אין תוצאה שמורה לסשן הזה.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2>פרטי קשר ומקור</h2>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt>טלפון</dt>
              <dd dir="ltr">{lead.phone}</dd>
            </div>
            <div className={styles.row}>
              <dt>אימייל</dt>
              <dd dir="ltr">{lead.email || '—'}</dd>
            </div>
            <div className={styles.row}>
              <dt>סטטוס</dt>
              <dd>
                <StatusControl sessionId={sessionId} initialStatus={initialStatus} />
              </dd>
            </div>
            <div className={styles.row}>
              <dt>נוצר</dt>
              <dd dir="ltr">{new Date(lead.createdAt).toLocaleString('en-GB')}</dd>
            </div>
            <div className={styles.row}>
              <dt>UTM</dt>
              <dd dir="ltr">{[lead.utmSource, lead.utmCampaign].filter(Boolean).join(' / ') || '—'}</dd>
            </div>
            {lead.message && (
              <div className={styles.row}>
                <dt>הודעה</dt>
                <dd>{lead.message}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className={styles.section}>
          <h2>סיווג נתונים</h2>
          <p className={styles.hint}>הסיווג הזה נפרד מסטטוס הטיפול בליד ומשפיע על נתוני הייצור.</p>
          <TestClassificationControl sessionId={sessionId} initialIsTest={lead.isTest} />
        </section>

        <LeadBriefPanel sessionId={sessionId} initialBrief={brief} />
      </div>
    </main>
  );
}
