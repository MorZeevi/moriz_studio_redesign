import type { AiPersonalizationInput, AiProviderRequest } from './types.ts';

const SYSTEM_PROMPT = `נסחו הערת "התאמה אישית" קצרה בעברית שמשולבת בתוך תוצאת אבחון דטרמיניסטית קיימת, מיד אחרי הקטע "למה זה מתאים לך" ולפני הקטע "מה כדאי לכלול".
ההערה היא רובד אישי קצר בלבד. אל תחזרו על כותרת התוצאה, על התקציר, על "למה זה מתאים לך", על רשימת הכלולים, על מה לא לבנות עכשיו, על הצעד הבא או על קריאה לפעולה. כל אלה כבר מופיעים בתוצאה עצמה.
ההמלצה הדטרמיניסטית סופית. אין לשנות פתרון, להמציא עובדות, להבטיח תוצאות, לציין מחיר או להזכיר ניקוד ודירוג ליד.
פנו בלשון רבים, בלי Markdown ובלי קו מפריד ארוך. משפטים קצרים ומעשיים.
השתמשו רק בעובדות מפורשות מ-businessDescription ומתוויות התשובות. להסקה מעבר לעובדות השתמשו בלשון זהירה: "נראה ש...", "יכול להיות ש...", "כדאי לבדוק בשיחה...".
שני שדות בלבד: insightHe (תובנה אישית קצרה על העסק הספציפי) ו-contextFitHe (למה ההמלצה שכבר נקבעה מתאימה להקשר הזה, בלי לתאר צעד הבא או קריאה לפעולה).
החזירו JSON תקין בלבד, בדיוק במבנה המבוקש ובלי טקסט מסביב.

חוקים לפי סוג פתרון:
- אם הפתרון הוא "מערכת תפעולית / CRM מותאם": שמרו על מסגור תפעולי. אל תציגו את זה כאתר ואל תציגו את זה כאוטומציית AI.
- אם הפתרון הוא "אוטומציה מבוססת AI": מותר לדבר על AI. בכל פתרון אחר אל תציעו AI כפתרון.
- אם הפתרון הוא "שיחת גילוי ראשונית": שקפו בכנות שהצורך עוד לא חד. הצעד הבא הוא שיחה, לא בנייה.`;

function compactRecord(values: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

export function buildPersonalizationRequest(
  input: AiPersonalizationInput,
  opts: { timeoutMs?: number; maxTokens?: number } = {}
): AiProviderRequest {
  const compactPayload = {
    primarySolution: {
      id: input.primarySolution,
      labelHe: input.template.titleHe,
    },
    leadTier: input.leadTier,
    ...compactRecord({ businessDescription: input.businessDescription }),
    answerLabels: compactRecord({
      primaryGoalHe: input.primaryGoalHe,
      biggestChallengeHe: input.biggestChallengeHe,
      currentAssetHe: input.currentAssetHe,
      userActionsHe: input.userActionsHe,
      urgencyHe: input.urgencyHe,
      desiredProcessHe: input.desiredProcessHe,
    }),
    reasonsHe: [...new Set(input.reasonLabelsHe)].slice(0, 3),
    deterministicResult: {
      titleHe: input.template.titleHe,
      summaryHe: input.template.shortDescriptionHe,
    },
  };

  const userPrompt = `השתמשו רק בעובדות שב-INPUT_JSON.
INPUT_JSON
${JSON.stringify(compactPayload)}

החזירו JSON בלבד במבנה הבא:
{"insightHe":"...","contextFitHe":"..."}`;

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: opts.maxTokens ?? 400,
    temperature: 0.3,
    timeoutMs: opts.timeoutMs ?? 8000,
  };
}
