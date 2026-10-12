import type { DiagnosticAnswers, SolutionType } from './types.ts';

// Hand-built full answer sets (all 7 questions, post-P9a-slice-2), one per expected
// primary solution. Readable, not exhaustive; scoring.test.ts asserts how each scores.
// P9a slice 2 (2026-07-10): personalization_need removed; user_actions reworded to the
// current-workflow framing. Each user_actions selection is what customers/staff do today,
// and the deterministic scorer infers the digital direction from it. Pain/lead inputs
// (biggest_challenge / urgency / desired_process) are byte-identical to the pre-slice-2
// fixtures, so lead tier and pain stay invariant across the slice.
export const FIXTURES: Record<SolutionType, DiagnosticAnswers> = {
  trust_website: {
    business_description: { type: 'text', value: 'קליניקה קטנה לטיפולי פנים ברמת גן' },
    primary_goal: { type: 'single', optionId: 'explain_business' },
    biggest_challenge: { type: 'single', optionId: 'unclear_value' },
    current_asset: { type: 'single', optionId: 'nothing' },
    user_actions: { type: 'multi', optionIds: ['understand_fit'] },
    urgency: { type: 'single', optionId: 'this_month' },
    desired_process: { type: 'single', optionId: 'short_focused' },
  },
  complex_website: {
    business_description: { type: 'text', value: 'סטודיו לריהוט בהזמנה אישית עם קטלוג גדול' },
    primary_goal: { type: 'single', optionId: 'sell_online' },
    biggest_challenge: { type: 'single', optionId: 'too_much_information' },
    current_asset: { type: 'single', optionId: 'site_needs_upgrade' },
    user_actions: { type: 'multi', optionIds: ['understand_fit', 'buy_order_pay'] },
    urgency: { type: 'single', optionId: 'this_month' },
    desired_process: { type: 'single', optionId: 'full_process' },
  },
  interactive_tool: {
    business_description: { type: 'text', value: 'יועצת משכנתאות שעוזרת לזוגות צעירים' },
    primary_goal: { type: 'single', optionId: 'interactive_tool' },
    biggest_challenge: { type: 'single', optionId: 'hard_to_explain' },
    current_asset: { type: 'single', optionId: 'basic_site' },
    user_actions: { type: 'multi', optionIds: ['get_recommendation'] },
    urgency: { type: 'single', optionId: 'this_month' },
    desired_process: { type: 'single', optionId: 'full_process' },
  },
  lead_flow_system: {
    business_description: { type: 'text', value: 'משרד עורכי דין לנדל"ן שרוצה יותר פניות' },
    primary_goal: { type: 'single', optionId: 'generate_leads' },
    biggest_challenge: { type: 'single', optionId: 'site_not_converting' },
    current_asset: { type: 'single', optionId: 'basic_site' },
    user_actions: { type: 'multi', optionIds: ['contact_or_book', 'understand_fit'] },
    urgency: { type: 'single', optionId: 'asap' },
    desired_process: { type: 'single', optionId: 'short_focused' },
  },
  web_app: {
    business_description: { type: 'text', value: 'חברת ניהול נכסים עם עשרות בעלי דירות' },
    primary_goal: { type: 'single', optionId: 'user_system' },
    biggest_challenge: { type: 'single', optionId: 'too_much_information' },
    current_asset: { type: 'single', optionId: 'existing_system' },
    user_actions: { type: 'multi', optionIds: ['check_status', 'exchange_documents'] },
    urgency: { type: 'single', optionId: 'this_month' },
    desired_process: { type: 'single', optionId: 'ongoing_product' },
  },
  operations_crm: {
    business_description: { type: 'text', value: 'קליניקת שיניים עם כמה סניפים שמנהלת הכל בוואטסאפ ואקסל' },
    primary_goal: { type: 'single', optionId: 'digitize_manual_process' },
    biggest_challenge: { type: 'single', optionId: 'manual_process' },
    current_asset: { type: 'single', optionId: 'manual_process_to_digitize' },
    user_actions: { type: 'multi', optionIds: ['track_work'] },
    urgency: { type: 'single', optionId: 'this_month' },
    desired_process: { type: 'single', optionId: 'ongoing_product' },
  },
  ai_automation: {
    business_description: { type: 'text', value: 'סוכנות ביטוח שמנהלת הכל בטלפונים ובאקסל' },
    primary_goal: { type: 'single', optionId: 'digitize_manual_process' },
    biggest_challenge: { type: 'single', optionId: 'manual_process' },
    current_asset: { type: 'single', optionId: 'manual_process_to_digitize' },
    user_actions: { type: 'multi', optionIds: ['track_work', 'process_information'] },
    urgency: { type: 'single', optionId: 'asap' },
    desired_process: { type: 'single', optionId: 'mvp' },
  },
  discovery: {
    business_description: { type: 'text', value: 'יש לנו רעיון למוצר דיגיטלי בתחום החינוך' },
    primary_goal: { type: 'single', optionId: 'not_sure' },
    biggest_challenge: { type: 'single', optionId: 'unshaped_product_idea' },
    current_asset: { type: 'single', optionId: 'nothing' },
    user_actions: { type: 'multi', optionIds: ['get_recommendation'] },
    urgency: { type: 'single', optionId: 'exploring' },
    desired_process: { type: 'single', optionId: 'spec_first' },
  },
};

// P9a slice 2 §M.2 adversarial pair: the current-workflow signal must never overpower the
// declared goal. Not SolutionType-keyed (these assert engine behavior, not a bucket win).
// A: a web-shaped workflow (check_status + exchange_documents = web 3) tied with the lead
//    goal (lead 3). The goal-favored tie-break keeps lead ahead, but the top (3) is below
//    CONFIDENCE_FLOOR, so the engine returns discovery, not web_app. Workflow can't invent
//    confidence the goal doesn't have.
// B: the same web-shaped workflow, but short_focused lifts lead to 4 (>= floor). Now the
//    goal wins as primary and the web workflow surfaces only as the close secondary.
export const ADVERSARIAL_FIXTURES: Record<string, DiagnosticAnswers> = {
  workflow_cannot_override_goal: {
    business_description: { type: 'text', value: 'עסק חדש שרוצה להתחיל להביא פניות מלקוחות' },
    primary_goal: { type: 'single', optionId: 'generate_leads' },
    biggest_challenge: { type: 'single', optionId: 'starting_from_zero' },
    current_asset: { type: 'single', optionId: 'design_ready' },
    user_actions: { type: 'multi', optionIds: ['check_status', 'exchange_documents'] },
    urgency: { type: 'single', optionId: 'exploring' },
    desired_process: { type: 'single', optionId: 'full_process' },
  },
  goal_survives_with_workflow_secondary: {
    business_description: { type: 'text', value: 'עסק חדש שרוצה להתחיל להביא פניות מלקוחות' },
    primary_goal: { type: 'single', optionId: 'generate_leads' },
    biggest_challenge: { type: 'single', optionId: 'starting_from_zero' },
    current_asset: { type: 'single', optionId: 'design_ready' },
    user_actions: { type: 'multi', optionIds: ['check_status', 'exchange_documents'] },
    urgency: { type: 'single', optionId: 'exploring' },
    desired_process: { type: 'single', optionId: 'short_focused' },
  },
};
