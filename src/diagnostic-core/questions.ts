import type { Question } from './types.ts';

// Staged questionnaire: 7 user-facing questions (6 structured + 1 required free-text).
// Stage ids group related topics; the progress UI counts each visible question from 1 to 7.
// P4d removed desired_user_action (overlapped with user_actions) and applied the
// P4c-revised copy for primary_goal / biggest_challenge / user_actions.
// P4e removed project_stage, audience_complexity, integration_needs, experience_level,
// and desired_solution_outcome: confirmatory or meta-only signal; every unique bit is
// covered by a kept question or moves to the human follow-up call.
// P9a slice 1 (2026-07-07): copy-only revision per Mor's product review; ids unchanged.
// P9a slice 2 (2026-07-10): user_actions reworded to current-workflow framing (eight new
// options); personalization_need removed. Deterministic direction is inferred from the
// workflow the business runs today. Historical copy for both is kept in
// LEGACY_QUESTION_COPY (below) so old stored answers stay readable in the admin view.
// No em dash in any user-facing Hebrew string.
const STAGE_TITLES: Record<number, string> = {
  0: 'רגע לפני שמתחילים',
  1: 'מה אתם מנסים להשיג?',
  2: 'מה לא עובד היום?',
  3: 'איך הדברים עובדים היום?',
  4: 'איפה אתם נמצאים עכשיו?',
};

export const QUESTIONS: Question[] = [
  {
    id: 'business_description',
    type: 'textarea',
    promptHe: 'בכמה מילים, מה העסק עושה ולמי הוא עוזר?',
    helpHe: 'משפט אחד מספיק.',
    placeholderHe: 'לדוגמה: קליניקה שעוזרת לנשים לבחור טיפול אסתטי שמתאים להן.',
    required: true,
    minLengthTrimmed: 10,
    stageId: 0,
    stageTitleHe: STAGE_TITLES[0],
    // Personalization context only. Must never feed the deterministic scoring.
  },
  {
    id: 'primary_goal',
    type: 'single',
    promptHe: 'איזו תוצאה הכי חשובה לכם?',
    helpHe: 'אם יש כמה דברים, בחרו את החשוב ביותר.',
    required: true,
    stageId: 1,
    stageTitleHe: STAGE_TITLES[1],
    options: [
      { id: 'explain_business', labelHe: 'שיהיה ברור מי אנחנו ומה אנחנו מציעים' },
      { id: 'generate_leads', labelHe: 'יותר פניות מלקוחות מתאימים' },
      { id: 'sell_online', labelHe: 'למכור מוצרים או שירותים אונליין' },
      { id: 'digitize_manual_process', labelHe: 'לחסוך עבודה ידנית שחוזרת על עצמה' },
      { id: 'interactive_tool', labelHe: 'לתת ללקוחות תשובה או המלצה דרך כלי, כמו מחשבון או שאלון' },
      { id: 'user_system', labelHe: 'מערכת שהעסק והלקוחות עובדים בה באופן שוטף' },
      { id: 'upgrade_existing', labelHe: 'לשפר אתר קיים' },
      { id: 'not_sure', labelHe: 'עוד לא בטוחים, רוצים להבין מה נכון' },
    ],
  },
  {
    id: 'biggest_challenge',
    type: 'single',
    promptHe: 'מה האתגר הכי גדול שלכם כרגע?',
    required: true,
    stageId: 2,
    stageTitleHe: STAGE_TITLES[2],
    options: [
      { id: 'unclear_value', labelHe: 'אנשים לא מבינים מהר מה הערך שלנו' },
      { id: 'site_not_converting', labelHe: 'האתר הקיים לא מייצר מספיק פניות או מכירות' },
      { id: 'manual_process', labelHe: 'יותר מדי עבודה ידנית שגוזלת זמן' },
      { id: 'hard_to_explain', labelHe: 'קשה להסביר את השירות או המוצר שלנו' },
      { id: 'too_much_information', labelHe: 'יש הרבה מידע וקשה לארגן אותו' },
      { id: 'need_differentiated_experience', labelHe: 'אנחנו לא בולטים מספיק מול מתחרים' },
      { id: 'unshaped_product_idea', labelHe: 'יש לנו רעיון למוצר דיגיטלי, אבל עוד לא ברור מה בדיוק צריך לבנות' },
      { id: 'starting_from_zero', labelHe: 'אנחנו מתחילים מאפס' },
    ],
  },
  {
    id: 'current_asset',
    type: 'single',
    promptHe: 'יש לכם היום אתר או מערכת קיימת?',
    required: true,
    stageId: 2,
    stageTitleHe: STAGE_TITLES[2],
    options: [
      { id: 'nothing', labelHe: 'אין לנו עדיין כלום' },
      { id: 'basic_site', labelHe: 'יש אתר בסיסי' },
      { id: 'site_needs_upgrade', labelHe: 'יש אתר אבל הוא צריך שדרוג משמעותי' },
      { id: 'existing_system', labelHe: 'יש מערכת / מוצר דיגיטלי קיים' },
      { id: 'design_ready', labelHe: 'יש עיצוב / אפיון אבל עדיין אין פיתוח' },
      { id: 'manual_process_to_digitize', labelHe: 'יש תהליך ידני שאנחנו רוצים להפוך לדיגיטלי' },
    ],
  },
  {
    id: 'user_actions',
    type: 'multi',
    promptHe: 'מה הייתם רוצים שיהיה קל ומסודר יותר בעבודה מול לקוחות או בניהול השוטף?',
    helpHe: 'אפשר לבחור כמה תשובות, גם אם היום זה נעשה ידנית או בצורה מסורבלת.',
    required: true,
    stageId: 3,
    stageTitleHe: STAGE_TITLES[3],
    options: [
      { id: 'understand_fit', labelHe: 'להבין מה מתאים ללקוח' },
      { id: 'contact_or_book', labelHe: 'להשאיר פרטים או לקבוע' },
      { id: 'buy_order_pay', labelHe: 'לקנות, להזמין או לשלם' },
      { id: 'get_recommendation', labelHe: 'לקבל תשובה, אבחון או המלצה' },
      { id: 'check_status', labelHe: 'לבדוק מידע אישי או סטטוס' },
      { id: 'exchange_documents', labelHe: 'לשלוח או לקבל מסמכים' },
      { id: 'track_work', labelHe: 'לעקוב אחרי לקוחות, משימות או סטטוסים' },
      { id: 'process_information', labelHe: 'לקרוא, למיין או לסכם מידע שמגיע שוב ושוב' },
    ],
  },
  {
    id: 'urgency',
    type: 'single',
    promptHe: 'מה רמת הדחיפות?',
    required: true,
    stageId: 4,
    stageTitleHe: STAGE_TITLES[4],
    options: [
      { id: 'asap', labelHe: 'רוצים להתחיל כמה שיותר מהר' },
      { id: 'this_month', labelHe: 'בחודש הקרוב' },
      { id: 'next_months', labelHe: 'בחודשים הקרובים' },
      { id: 'exploring', labelHe: 'רק בודקים כיוון' },
      { id: 'depends_on_recommendation', labelHe: 'תלוי בהמלצה ובעלות' },
    ],
  },
  {
    id: 'desired_process',
    type: 'single',
    promptHe: 'איך הכי נוח לכם להתקדם?',
    required: true,
    stageId: 4,
    stageTitleHe: STAGE_TITLES[4],
    options: [
      { id: 'short_focused', labelHe: 'רוצים משהו קטן וממוקד' },
      { id: 'full_process', labelHe: 'רוצים לבנות פתרון משמעותי בשלבים' },
      { id: 'spec_first', labelHe: 'עוד לא בטוחים, רוצים קודם להבין מה נכון לבנות' },
      { id: 'mvp', labelHe: 'רוצים להתחיל בגרסה ראשונה קטנה ולבדוק' },
      { id: 'upgrade_existing', labelHe: 'רוצים לשפר משהו שכבר קיים' },
      { id: 'ongoing_product', labelHe: 'רוצים ליווי מתמשך בפיתוח המוצר' },
    ],
  },
];

// Historical questionnaire copy for questions/options that no longer appear in the active
// flow. Kept so the admin lead view can render legacy stored answers in Hebrew instead of
// raw ids. Never shown to end users, never scored, never validated as a current answer.
// P9a slice 2 (2026-07-10): user_actions was reworded and personalization_need removed;
// these are the pre-slice-2 strings. Byte-exact with the questions as they last shipped.
export const LEGACY_QUESTION_COPY = {
  user_actions: {
    promptHe: 'אילו פעולות המשתמשים יעשו בפועל בתוך הפתרון?',
    helpHe: 'הפעולות עצמן בתוך הפתרון, לא המטרה העסקית.',
    optionsHe: {
      read_and_understand: 'לקרוא מידע ולהבין את השירות',
      leave_details: 'להשאיר פרטים',
      buy_or_pay: 'לקנות או לשלם',
      answer_questionnaire: 'לענות על שאלון',
      receive_result: 'לקבל תוצאה / המלצה / אבחון',
      login: 'להתחבר לאזור אישי',
      upload_info: 'להעלות קבצים או מידע',
      manage_process: 'לנהל תהליך, סטטוס או נתונים',
      use_dashboard: 'להשתמש בדשבורד',
      simple_site_only: 'לא צריך משהו מורכב, רק אתר פשוט וברור',
    },
  },
  personalization_need: {
    promptHe: 'האם הפתרון צריך להתאים את עצמו לפי המשתמש?',
    optionsHe: {
      same_for_everyone: 'לא, כולם רואים את אותו הדבר',
      by_questionnaire: 'כן, לפי תשובות בשאלון',
      by_customer_type: 'כן, לפי סוג לקוח / קהל יעד',
      by_user_data: 'כן, לפי נתונים שהמשתמש מזין',
      ai_or_smart_recommendations: 'כן, באמצעות AI או המלצות חכמות',
      not_sure: 'לא בטוחים',
    },
  },
} as const;
