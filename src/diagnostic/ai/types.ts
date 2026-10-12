import type { LeadTier, SolutionType } from '../../diagnostic-core/types.ts';

// ── P5b AI personalization contracts ─────────────────────────────────────────
// Server-built input only; the deterministic scoring engine has already
// decided primarySolution/secondarySolution/leadTier/scores before this is
// built. AI may only reword-personalize the decided result — it never
// re-decides it. PersonalizedDiagnosticCopy carries no decision fields; that
// is the guardrail, enforced by this type shape plus the immutability tests.

export interface AiPersonalizationInput {
  sessionId: string;
  businessDescription?: string;
  primaryGoalHe?: string;
  biggestChallengeHe?: string;
  currentAssetHe?: string;
  userActionsHe: string[];
  urgencyHe?: string;
  desiredProcessHe?: string;
  primarySolution: SolutionType;
  secondarySolution?: SolutionType;
  secondaryTitleHe?: string;
  leadTier: LeadTier;
  painScore: number;
  reasonLabelsHe: string[];
  template: {
    titleHe: string;
    shortDescriptionHe: string;
    whyHe: string;
    whatToIncludeHe: string[];
    whatNotToBuildNowHe: string[];
    recommendedNextStepHe: string;
  };
}

// P5f: a short note rendered INSIDE the deterministic result flow, between
// "why this fits you" and "what to include". No title/summary/include-list/
// next-step/CTA of its own — those belong to the deterministic
// DiagnosticResult, which owns the only "הצעד הבא". Two fields only: an
// insight tied to the business, and why the (already-decided) recommendation
// fits this context.
export interface PersonalizedDiagnosticCopy {
  insightHe: string; // <= 400
  contextFitHe: string; // <= 500
}

export type AiFallbackReason =
  | 'disabled'
  | 'timeout'
  | 'provider_error'
  | 'invalid_output'
  | 'rate_limited'; // type-only for now; no code path produces this before P6

export type AiPersonalizationResult =
  | {
      status: 'generated';
      copy: PersonalizedDiagnosticCopy;
      provider: string;
      model: string;
      generatedAt: string;
      latencyMs: number;
    }
  | { status: 'fallback'; reason: AiFallbackReason };

export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export type AiProviderResponse =
  | { ok: true; text: string }
  | { ok: false; error: 'timeout' | 'http_error' | 'network_error' | 'empty_response' };

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  generate(req: AiProviderRequest): Promise<AiProviderResponse>;
}
