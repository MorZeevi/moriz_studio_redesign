import { parsePersonalizedCopy } from './validateOutput.ts';
import type {
  AiPersonalizationResult,
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from './types.ts';

export interface GeneratePersonalizationOptions {
  enabled: boolean;
  getProvider: () => AiProvider;
  request: AiProviderRequest;
}

// Orchestration only: prompt building is P5c, this takes an already-built
// request. Never lets a provider error or thrown exception escape — every
// failure path resolves to a typed fallback instead. getProvider() and
// provider.generate() share one try/catch (a throwing factory is as much a
// provider failure as a throwing call); parsePersonalizedCopy gets its own,
// since a malformed response.text must fall back rather than throw past this
// function even though the AiProviderResponse type promises text is a string.
export async function generatePersonalization(
  opts: GeneratePersonalizationOptions
): Promise<AiPersonalizationResult> {
  if (!opts.enabled) {
    return { status: 'fallback', reason: 'disabled' };
  }

  const startedAt = Date.now();

  let provider: AiProvider;
  let response: AiProviderResponse;
  try {
    provider = opts.getProvider();
    response = await provider.generate(opts.request);
  } catch (err) {
    // Failure-only diagnostic: an env/config throw (bad AI_PROVIDER, missing
    // key) lands here, whereas an HTTP failure never throws — it returns a
    // typed !ok below. The thrown messages are our own strings, no secrets.
    console.warn('[diagnostic] personalize provider threw', {
      message: err instanceof Error ? err.message : String(err),
    });
    return { status: 'fallback', reason: 'provider_error' };
  }

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    return {
      status: 'fallback',
      reason: response.error === 'timeout' ? 'timeout' : 'provider_error',
    };
  }

  // biome-ignore lint/suspicious/noImplicitAnyLet: type is inferred from the try-block assignment, kept verbatim from the standalone app
  let parsed;
  try {
    parsed = parsePersonalizedCopy(response.text);
  } catch {
    return { status: 'fallback', reason: 'invalid_output' };
  }
  if (!parsed.valid) {
    return { status: 'fallback', reason: 'invalid_output' };
  }

  return {
    status: 'generated',
    copy: parsed.value,
    provider: provider.name,
    model: provider.model,
    generatedAt: new Date().toISOString(),
    latencyMs,
  };
}
