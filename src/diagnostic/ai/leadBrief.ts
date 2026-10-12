import type { LeadBriefFailureReason } from '../api-types.ts';
import type { ValidationResult } from '../validation.ts';
import { buildLeadBriefRequest, type LeadBriefPromptInput } from './leadBriefPrompt.ts';
import { MoonshotProvider } from './moonshotProvider.ts';
import type { AiProvider, AiProviderResponse } from './types.ts';

// ── P8a lead brief composer (§C.4) ───────────────────────────────────────────
// Own gate + limits; the personalization stack (provider.ts / personalize.ts)
// is untouched. MoonshotProvider is reused as-is — its request shape is
// generic (system/user prompt + limits), so no second fetch implementation.

const MAX_TOKENS_DEFAULT = 2500;
const MAX_TOKENS_MIN = 500;
const MAX_TOKENS_MAX = 4000;
const TIMEOUT_MS_DEFAULT = 30000;
const TIMEOUT_MS_MIN = 5000;
const TIMEOUT_MS_MAX = 120000;

// Same cap the paste path enforces (leadBriefService MAX_BRIEF_TEXT_LENGTH):
// the generator may never produce a brief the manual path couldn't store.
export const MAX_BRIEF_FIELD_LENGTH = 12000;

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export interface LeadBriefRuntime {
  enabled: boolean;
  timeoutMs: number;
  maxTokens: number;
  getProvider: () => AiProvider;
}

export function resolveLeadBriefRuntime(env: NodeJS.ProcessEnv = process.env): LeadBriefRuntime {
  return {
    enabled: env.LEAD_BRIEF_AI_ENABLED === 'true',
    timeoutMs: clampInt(env.LEAD_BRIEF_TIMEOUT_MS, TIMEOUT_MS_DEFAULT, TIMEOUT_MS_MIN, TIMEOUT_MS_MAX),
    maxTokens: clampInt(env.LEAD_BRIEF_MAX_TOKENS, MAX_TOKENS_DEFAULT, MAX_TOKENS_MIN, MAX_TOKENS_MAX),
    getProvider: () => {
      const apiKey = env.MOONSHOT_API_KEY?.trim();
      if (!apiKey) {
        throw new Error('MOONSHOT_API_KEY is required for lead brief generation');
      }
      return new MoonshotProvider({
        apiKey,
        baseUrl: env.MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1',
        model: env.MOONSHOT_MODEL || 'kimi-k2-0711-preview',
        diagnosticsEnabled: env.NODE_ENV === 'development',
      });
    },
  };
}

export interface LeadBriefTexts {
  internalBriefMd: string;
  clientAuditMd: string;
}

const REQUIRED_KEYS = ['internalBriefMd', 'clientAuditMd'] as const;

// Strips a single wrapping ``` or ```json fence (same rule as validateOutput.ts).
function stripCodeFence(text: string): string {
  const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/.exec(text);
  return match ? match[1].trim() : text;
}

function boundedString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  return trimmed;
}

// All-or-nothing: wrong type, missing/unknown key, empty field, cap violation,
// or unparsable payload rejects the whole output. No partial acceptance.
export function parseLeadBriefOutput(raw: string): ValidationResult<LeadBriefTexts> {
  const stripped = stripCodeFence(raw.trim());

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return { valid: false, error: 'invalid_json' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, error: 'payload_not_object' };
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== REQUIRED_KEYS.length || !REQUIRED_KEYS.every((key) => key in record)) {
    return { valid: false, error: 'unexpected_keys' };
  }

  const internalBriefMd = boundedString(record.internalBriefMd, MAX_BRIEF_FIELD_LENGTH);
  if (!internalBriefMd) return { valid: false, error: 'invalid_internalBriefMd' };

  const clientAuditMd = boundedString(record.clientAuditMd, MAX_BRIEF_FIELD_LENGTH);
  if (!clientAuditMd) return { valid: false, error: 'invalid_clientAuditMd' };

  return { valid: true, value: { internalBriefMd, clientAuditMd } };
}

export type ComposeLeadBriefResult =
  | ({ ok: true } & LeadBriefTexts)
  | { ok: false; reason: LeadBriefFailureReason };

// Never throws: every failure is a typed reason the route maps to a 200
// { ok: false, reason }. Exactly one structured log line per generation —
// sessionId, ok/reason, latencyMs; never the key, the prompt, or a raw body.
export async function composeLeadBrief(
  input: LeadBriefPromptInput,
  runtime: LeadBriefRuntime = resolveLeadBriefRuntime()
): Promise<ComposeLeadBriefResult> {
  if (!runtime.enabled) {
    return { ok: false, reason: 'disabled' };
  }

  const startedAt = Date.now();
  const finish = (result: ComposeLeadBriefResult): ComposeLeadBriefResult => {
    console.info('[diagnostic] lead brief generation', {
      sessionId: input.sessionId,
      ok: result.ok,
      ...(result.ok ? {} : { reason: result.reason }),
      latencyMs: Date.now() - startedAt,
    });
    return result;
  };

  let response: AiProviderResponse;
  try {
    const provider = runtime.getProvider();
    response = await provider.generate(
      buildLeadBriefRequest(input, { maxTokens: runtime.maxTokens, timeoutMs: runtime.timeoutMs })
    );
  } catch {
    // getProvider (missing key) or an unexpected provider throw; the provider
    // itself already maps timeouts/network errors to a typed { ok: false }.
    return finish({ ok: false, reason: 'provider_error' });
  }

  if (!response.ok) {
    return finish({ ok: false, reason: response.error === 'timeout' ? 'timeout' : 'provider_error' });
  }

  const parsed = parseLeadBriefOutput(response.text);
  if (!parsed.valid) {
    return finish({ ok: false, reason: 'invalid_output' });
  }

  return finish({ ok: true, ...parsed.value });
}
