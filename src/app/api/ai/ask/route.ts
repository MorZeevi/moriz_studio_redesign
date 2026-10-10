import { type AiAnswer, askKimi } from "@/lib/ai/kimi";
import { buildSystemPrompt, getActiveKnowledge } from "@/lib/ai/knowledge";
import { MAX_QUESTION_LENGTH } from "@/lib/ai/question";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const raw =
    typeof body === "object" && body !== null && "question" in body
      ? body.question
      : null;
  const question = typeof raw === "string" ? raw.trim() : "";
  if (!question || question.length > MAX_QUESTION_LENGTH)
    return Response.json(
      { error: "invalid_question" },
      { status: 400, headers },
    );

  try {
    const knowledge = await getActiveKnowledge();
    // Nothing to answer from yet, so skip the model call entirely.
    if (knowledge.length === 0)
      return Response.json(
        { answer: "", hasAnswer: false } satisfies AiAnswer,
        { headers },
      );
    const result = await askKimi(buildSystemPrompt(knowledge), question);
    return Response.json(result satisfies AiAnswer, { headers });
  } catch (error) {
    console.error("[ai/ask]", error);
    return Response.json({ error: "ai_unavailable" }, { status: 502, headers });
  }
}
