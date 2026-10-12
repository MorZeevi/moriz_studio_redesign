import { QUESTIONS } from '../../diagnostic-core/questions.ts';
import type {
  AnswerValue,
  DiagnosticAnswers,
  DiagnosticResult,
  MatchedSignal,
  Question,
} from '../../diagnostic-core/types.ts';
import type { AiProviderRequest } from './types.ts';

// ── P8a lead brief prompt (§C.4) ─────────────────────────────────────────────
// Every input is server-derived: answers/snapshot come from DB readback, the
// contact fields from the stored lead row, evidenceMd from the admin panel.
// Nothing here is client-trusted. UTM is deliberately absent from the prompt.

export interface LeadBriefPromptInput {
  sessionId: string;
  fullName: string;
  businessName: string | null;
  link: string | null;
  answers: DiagnosticAnswers;
  snapshot: DiagnosticResult | null;
  evidenceMd: string;
}

// Guardrail block per dispatch §C.4 + approval note 3: evidence-only reality
// side, every gap statement anchored to an evidence line, the deterministic
// verdict is final, and the client audit is observations with no prices,
// timelines, or revenue/ROI promises. No em dash in Hebrew output.
const SYSTEM_PROMPT = `אתם מסייעים פנימיים של סטודיו לפיתוח אתרים. תקבלו INPUT_JSON עם: תשובות שאלון של ליד (ההצהרה), תוצאת אבחון דטרמיניסטית שכבר נקבעה (הפסיקה), ושורות ראיות שנאספו ידנית מבדיקת הנוכחות הדיגיטלית של העסק (המציאות).

חוקים מחייבים:
- לצד המציאות השתמשו אך ורק בשורות הראיות שסופקו ב-evidence. אם הראיות דלות, כתבו פחות. לעולם אל תמציאו ממצאים, עמודים, ביקורות, מדדים או מספרים שלא מופיעים בראיות.
- כל אמירה על פער, חיכוך או בעיה חייבת להפנות לשורת ראיה ספציפית מתוך evidence.
- ההמלצה הדטרמיניסטית (primarySolution) סופית. אסור לשנות, לערער או להחליף אותה. תפקידכם להסביר אותה מול הראיות, לא להחליט מחדש.
- internalBriefMd: בריף פנימי להכנת שיחת מכירה. עברית או עברית משולבת אנגלית, פרקטי, ישיר, כולל נקודות פתיחה לשיחה.
- clientAuditMd: טקסט ללקוח בעברית, טון של תצפיות, מכבד, בלי לשון מכירה אגרסיבית. בלי מחירים, בלי לוחות זמנים, בלי הבטחות הכנסה, תוצאות או ROI מכל סוג.
- בלי קו מפריד ארוך בטקסט עברי. משפטים קצרים.
החזירו JSON תקין בלבד, בדיוק במבנה {"internalBriefMd":"...","clientAuditMd":"..."} ובלי טקסט מסביב.`;

function answerLabel(question: Question, answer: AnswerValue | undefined): string {
  if (!answer) return 'לא נענה';
  if (answer.type === 'text') return answer.value;
  const options = question.options ?? [];
  if (answer.type === 'single') {
    return options.find((o) => o.id === answer.optionId)?.labelHe ?? answer.optionId;
  }
  return answer.optionIds.map((id) => options.find((o) => o.id === id)?.labelHe ?? id).join(', ');
}

function signalLabel(signal: MatchedSignal): string {
  if (signal.reasonHe) return signal.reasonHe;
  const question = QUESTIONS.find((q) => q.id === signal.questionId);
  const option = question?.options?.find((o) => o.id === signal.optionId);
  return option?.labelHe ?? `${signal.questionId}/${signal.optionId}`;
}

export function buildLeadBriefRequest(
  input: LeadBriefPromptInput,
  opts: { maxTokens: number; timeoutMs: number }
): AiProviderRequest {
  const { snapshot } = input;
  const payload = {
    contact: {
      fullName: input.fullName,
      businessName: input.businessName,
      link: input.link,
    },
    claimAnswers: QUESTIONS.map((question) => ({
      questionHe: question.promptHe,
      answerHe: answerLabel(question, input.answers[question.id]),
    })),
    deterministicVerdict: snapshot
      ? {
          primarySolution: snapshot.primarySolution,
          titleHe: snapshot.resultTemplate?.titleHe,
          secondarySolution: snapshot.secondarySolution,
          painScore: snapshot.painScore,
          leadQualityScore: snapshot.leadQualityScore,
          leadTier: snapshot.leadTier,
          reasonsHe: (snapshot.matchedSignals[snapshot.primarySolution] ?? []).map(signalLabel),
        }
      : null,
    evidence: input.evidenceMd,
  };

  const userPrompt = `השתמשו אך ורק בעובדות שב-INPUT_JSON. השדה evidence הוא צד המציאות היחיד. deterministicVerdict ריק פירושו שאין תוצאת אבחון שמורה, ואז מסתמכים על ההצהרה והראיות בלבד.
INPUT_JSON
${JSON.stringify(payload)}

החזירו JSON בלבד במבנה הבא:
{"internalBriefMd":"...","clientAuditMd":"..."}`;

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: opts.maxTokens,
    temperature: 0.3,
    timeoutMs: opts.timeoutMs,
  };
}
