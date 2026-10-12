import type { AiProvider, AiProviderRequest, AiProviderResponse } from './types.ts';

export interface MoonshotProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  thinkingEnabled?: boolean;
  diagnosticsEnabled?: boolean;
}

interface ChatCompletionsPayload {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

// ponytail: Moonshot-specific quirk — kimi-k2.x point releases (k2.5, k2.6, and
// future k2.*) reject any temperature other than 1 (400 invalid_request_error).
// Match by the dotted prefix so new point releases are covered without an edit;
// the dot excludes the dashed default `kimi-k2-0711-preview`, which accepts a
// custom temperature. Request temperature stays provider-neutral otherwise, so
// a future OpenAI provider is unaffected.
function supportsThinkingToggle(model: string): boolean {
  return model === 'kimi-k2.5' || model === 'kimi-k2.6';
}

function isAlwaysThinkingModel(model: string): boolean {
  return model.startsWith('kimi-k2.7');
}

// Bounded, secret-free excerpt of an error response body for diagnostics.
// Moonshot error bodies carry an error message, never the caller's key.
async function safeBodyExcerpt(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return '<unreadable>';
  }
}

export class MoonshotProvider implements AiProvider {
  readonly name = 'moonshot';
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly thinkingEnabled: boolean;
  private readonly diagnosticsEnabled: boolean;

  constructor(config: MoonshotProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.model = config.model;
    this.thinkingEnabled = config.thinkingEnabled ?? false;
    this.diagnosticsEnabled = config.diagnosticsEnabled ?? false;
  }

  // ponytail: failure-only diagnostic, server log only. Never logs the API
  // key, Authorization header, or request body. Surfaces the HTTP status +
  // bounded body excerpt that the opaque `provider_error` fallback discards,
  // so a live smoke reveals 401 vs 404 vs 400 vs network without a debugger.
  private logFailure(kind: string, extra: Record<string, unknown>): void {
    if (!this.diagnosticsEnabled) return;
    console.warn('[diagnostic] moonshot provider failure', {
      kind,
      endpoint: `${this.baseUrl}/chat/completions`,
      model: this.model,
      responseFormat: 'json_object',
      ...extra,
    });
  }

  async generate(req: AiProviderRequest): Promise<AiProviderResponse> {
    const controller = new AbortController();
    const timeoutMs = req.timeoutMs ?? 8000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const hasThinkingToggle = supportsThinkingToggle(this.model);
    const thinking = hasThinkingToggle
      ? this.thinkingEnabled
        ? 'enabled'
        : 'disabled'
      : isAlwaysThinkingModel(this.model)
        ? 'enabled'
        : 'unsupported';
    const temperature = hasThinkingToggle
      ? this.thinkingEnabled
        ? 1
        : 0.6
      : isAlwaysThinkingModel(this.model)
        ? 1
        : req.temperature;
    let headersReceived = false;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
          ],
          max_tokens: req.maxTokens,
          temperature,
          response_format: { type: 'json_object' },
          thinking: hasThinkingToggle ? { type: thinking } : undefined,
        }),
        signal: controller.signal,
      });
      headersReceived = true;

      if (!response.ok) {
        this.logFailure('http_error', {
          status: response.status,
          bodyExcerpt: await safeBodyExcerpt(response),
        });
        return { ok: false, error: 'http_error' };
      }

      let payload: ChatCompletionsPayload;
      try {
        payload = (await response.json()) as ChatCompletionsPayload;
      } catch {
        this.logFailure('empty_response', { status: response.status, note: 'json_parse_failed' });
        return { ok: false, error: 'empty_response' };
      }

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        this.logFailure('empty_response', { status: response.status, note: 'missing_content' });
        return { ok: false, error: 'empty_response' };
      }

      return { ok: true, text: content };
    } catch (error) {
      if (
        controller.signal.aborted ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError')
      ) {
        return { ok: false, error: 'timeout' };
      }
      this.logFailure('network_error', {
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message.slice(0, 300) : undefined,
      });
      return { ok: false, error: 'network_error' };
    } finally {
      clearTimeout(timer);
      if (this.diagnosticsEnabled) {
        console.info('[diagnostic] moonshot request', {
          model: this.model,
          timeoutMs,
          maxTokens: req.maxTokens,
          responseFormat: 'json_object',
          thinking,
          systemPromptChars: req.systemPrompt.length,
          userPayloadChars: req.userPrompt.length,
          totalPromptChars: req.systemPrompt.length + req.userPrompt.length,
          headersReceived,
        });
      }
    }
  }
}
