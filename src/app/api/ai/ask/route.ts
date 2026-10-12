import { type AiAnswer, askKimi } from "@/lib/ai/kimi";
import { buildSystemPrompt, getActiveKnowledge } from "@/lib/ai/knowledge";
import {
  type ChatTurn,
  MAX_ANSWER_LENGTH,
  MAX_HISTORY_TURNS,
  MAX_QUESTION_LENGTH,
} from "@/lib/ai/question";

const headers = { "Cache-Control": "private, no-store" };

// Earlier turns are optional; anything malformed or oversized rejects the request.
function parseHistory(value: unknown): ChatTurn[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_TURNS) return null;
  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const role = "role" in item ? item.role : null;
    const raw = "content" in item ? item.content : null;
    if ((role !== "user" && role !== "assistant") || typeof raw !== "string")
      return null;
    const content = raw.trim();
    const limit = role === "user" ? MAX_QUESTION_LENGTH : MAX_ANSWER_LENGTH;
    if (!content || content.length > limit) return null;
    turns.push({ role, content });
  }
  return turns;
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const fields = typeof body === "object" && body !== null ? body : {};
  const raw = "question" in fields ? fields.question : null;
  const question = typeof raw === "string" ? raw.trim() : "";
  const history = parseHistory(
    "history" in fields ? fields.history : undefined,
  );
  if (!question || question.length > MAX_QUESTION_LENGTH || !history)
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
    const result = await askKimi(buildSystemPrompt(knowledge), [
      ...history,
      { role: "user", content: question },
    ]);
    return Response.json(result satisfies AiAnswer, { headers });
  } catch (error) {
    console.error("[ai/ask]", error);
    return Response.json({ error: "ai_unavailable" }, { status: 502, headers });
  }
}
