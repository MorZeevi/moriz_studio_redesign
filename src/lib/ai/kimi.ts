import "server-only";

export type AiAnswer = { answer: string; hasAnswer: boolean };

function kimiConfig() {
  const provider = process.env.AI_PROVIDER ?? "moonshot";
  if (provider !== "moonshot")
    throw new Error(`AI_PROVIDER "${provider}" is not supported.`);
  const apiKey = process.env.MOONSHOT_API_KEY;
  const baseUrl = process.env.MOONSHOT_BASE_URL;
  const model = process.env.MOONSHOT_MODEL;
  if (!apiKey || !baseUrl || !model)
    throw new Error("Moonshot is not configured. Check the environment.");
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ""), model };
}

// Moonshot speaks the OpenAI chat-completions format; JSON mode keeps hasAnswer structured.
export async function askKimi(system: string, question: string) {
  const { apiKey, baseUrl, model } = kimiConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      // Reasoning roughly doubles latency and adds nothing to a lookup answer.
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: question },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      `Moonshot responded ${response.status}: ${await response.text()}`,
    );

  const body = await response.json();
  const parsed: unknown = JSON.parse(
    body?.choices?.[0]?.message?.content ?? "",
  );
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("answer" in parsed) ||
    !("hasAnswer" in parsed) ||
    typeof parsed.answer !== "string" ||
    typeof parsed.hasAnswer !== "boolean"
  )
    throw new Error("Moonshot returned an unexpected answer shape.");
  return {
    answer: parsed.answer.trim(),
    hasAnswer: parsed.hasAnswer,
  } satisfies AiAnswer;
}
