import type { ValidationResult } from '../validation.ts';
import type { PersonalizedDiagnosticCopy } from './types.ts';

const INSIGHT_MAX = 400;
const CONTEXT_FIT_MAX = 500;

const REQUIRED_KEYS = ['insightHe', 'contextFitHe'] as const;

// Strips a single wrapping ``` or ```json fence. Leaves non-fenced text untouched.
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

// All-or-nothing: any cap violation, wrong type, missing/unknown key, or
// unparsable payload rejects the whole thing. No partial acceptance.
export function parsePersonalizedCopy(raw: string): ValidationResult<PersonalizedDiagnosticCopy> {
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

  const insightHe = boundedString(record.insightHe, INSIGHT_MAX);
  if (!insightHe) return { valid: false, error: 'invalid_insightHe' };

  const contextFitHe = boundedString(record.contextFitHe, CONTEXT_FIT_MAX);
  if (!contextFitHe) return { valid: false, error: 'invalid_contextFitHe' };

  return {
    valid: true,
    value: { insightHe, contextFitHe },
  };
}
