// P6e — dev-only local readback smoke: prove the full analytics chain works
// end-to-end (stored diagnostic_events -> analytics-report.ts -> summary).
// Local script, not a route: never exposed over HTTP, so there is nothing to
// protect. Run: node --env-file=.env.local tools/diagnostic/analytics-readback.ts

import {
  getRecentDiagnosticEvents,
  getRecentTestDiagnosticEvents,
} from '../../src/diagnostic/db/queries.ts';
import {
  buildFunnelSummary,
  primarySolutionDistribution,
  leadTierDistribution,
  conversionByUtmSource,
  conversionByUtmCampaign,
} from '../../src/diagnostic/analytics-report.ts';
import type { EventReq } from '../../src/diagnostic/api-types.ts';

function report(label: string, events: EventReq[]): void {
  console.log(`\n=== ${label} (${events.length} events) ===`);
  console.log('funnel:', JSON.stringify(buildFunnelSummary(events)));
  console.log('primarySolution:', JSON.stringify(primarySolutionDistribution(events)));
  console.log('leadTier:', JSON.stringify(leadTierDistribution(events)));
  console.log('utm_source:', JSON.stringify(conversionByUtmSource(events)));
  console.log('utm_campaign:', JSON.stringify(conversionByUtmCampaign(events)));
}

type ReadbackScope = 'production' | 'test';

function parseArgs(args: string[]): { scope: ReadbackScope; limit?: number } {
  let scope: ReadbackScope = 'production';
  let limit: number | undefined;

  for (const arg of args) {
    if (arg.startsWith('--scope=')) {
      const value = arg.slice('--scope='.length);
      if (value !== 'production' && value !== 'test') {
        throw new Error('Invalid --scope. Use --scope=production or --scope=test.');
      }
      scope = value;
      continue;
    }

    const parsedLimit = Number(arg);
    if (limit !== undefined || !Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      throw new Error('Limit must be one positive integer.');
    }
    limit = parsedLimit;
  }

  return { scope, limit };
}

const { scope, limit } = parseArgs(process.argv.slice(2));
const events =
  scope === 'test'
    ? await getRecentTestDiagnosticEvents(limit)
    : await getRecentDiagnosticEvents(limit);

report(scope.toUpperCase(), events);
