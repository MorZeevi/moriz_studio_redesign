import type { DiagnosticLead } from '../db/queries.ts';

const SEND_TIMEOUT_MS = 5000;

// Pure and network-free so content can be asserted without a live send.
export function buildNewLeadEmail(lead: DiagnosticLead): { subject: string; text: string } {
  const lines = [
    `New diagnostic lead: ${lead.fullName}`,
    ...(lead.email ? [`Email: ${lead.email}`] : []),
    `Phone: ${lead.phone}`,
    `Primary solution: ${lead.resultTitle ?? lead.primarySolution ?? 'unknown'}`,
    `Lead tier: ${lead.leadTier ?? 'unknown'}`,
    `UTM source: ${lead.utmSource ?? '—'}`,
    `UTM campaign: ${lead.utmCampaign ?? '—'}`,
    '',
    `Open the lead (sign in as the site owner): /digital-audit/admin/leads/${lead.sessionId}`,
  ];
  return { subject: `New lead: ${lead.fullName}`, text: lines.join('\n') };
}

// LEAD_NOTIFY_ENABLED is a kill switch, default off — mirrors AI_PERSONALIZATION_ENABLED
// in ai/provider.ts. Disabled or missing config -> silent no-op, no network call.
// Caller wraps this in try/catch: a notify failure must never turn lead
// persistence into a 500. Sends via Resend's plain HTTP API through `fetch`
// (no SDK), matching this project's third-party integration convention.
export async function notifyNewLead(lead: DiagnosticLead, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (env.LEAD_NOTIFY_ENABLED !== 'true') return;

  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.LEAD_NOTIFY_TO_EMAIL?.trim();
  const from = env.LEAD_NOTIFY_FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) {
    console.error(
      'lead notify: LEAD_NOTIFY_ENABLED=true but RESEND_API_KEY/LEAD_NOTIFY_TO_EMAIL/LEAD_NOTIFY_FROM_EMAIL missing'
    );
    return;
  }

  const { subject, text } = buildNewLeadEmail(lead);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`lead notify: resend responded ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}
