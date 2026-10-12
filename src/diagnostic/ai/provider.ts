import { MoonshotProvider } from './moonshotProvider.ts';
import type { AiProvider } from './types.ts';

export interface AiRuntime {
  enabled: boolean;
  timeoutMs: number;
  maxTokens: number;
  getProvider: () => AiProvider;
}

const DEFAULT_TIMEOUT_MS = 8000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 60000;
const DEFAULT_MAX_TOKENS = 400;
const MIN_MAX_TOKENS = 100;
const MAX_MAX_TOKENS = 800;

// AI_TIMEOUT_MS is optional. Unset/non-numeric/non-positive → 8000 default; a
// valid positive value is clamped to [1000, 60000] so no env typo can hang the
// request forever or abort it instantly. This is the sole reader of the var.
function resolveTimeoutMs(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.trunc(parsed)));
}

function resolveMaxTokens(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_TOKENS;
  return Math.min(MAX_MAX_TOKENS, Math.max(MIN_MAX_TOKENS, Math.trunc(parsed)));
}

export function resolveAiRuntime(env: NodeJS.ProcessEnv = process.env): AiRuntime {
  const enabled = env.AI_PERSONALIZATION_ENABLED === 'true';

  return {
    enabled,
    timeoutMs: resolveTimeoutMs(env.AI_TIMEOUT_MS),
    maxTokens: resolveMaxTokens(env.AI_MAX_TOKENS),
    getProvider: () => {
      if (env.AI_PROVIDER === 'openai') {
        throw new Error('AI_PROVIDER "openai" not implemented in P5c');
      }

      if (env.AI_PROVIDER !== 'moonshot') {
        throw new Error('Unknown or missing AI_PROVIDER');
      }

      const apiKey = env.MOONSHOT_API_KEY?.trim();
      if (!apiKey) {
        throw new Error('MOONSHOT_API_KEY is required when Moonshot personalization is enabled');
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
