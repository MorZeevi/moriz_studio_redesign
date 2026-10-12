import { QUESTIONS } from './questions.ts';
import { RESULT_TEMPLATES } from './resultTemplates.ts';
import { SOLUTION_TYPES } from './types.ts';
import type {
  DiagnosticAnswers,
  DiagnosticResult,
  LeadQualityScore,
  LeadTier,
  MatchedSignal,
  PainScore,
  SolutionScore,
  SolutionType,
} from './types.ts';

// P4b scoring remap. All weights/thresholds are named constants, easy to retune.
// Hebrew copy lives only in questions.ts / resultTemplates.ts, plus the short
// reasonHe strings on conditional combo rules below (they have no option label
// that explains the combo on its own).

type SolutionWeights = Partial<Record<SolutionType, number>>;

// ── Weight tiers ─────────────────────────────────────────────────────────────
// The declared goal is the strongest intent signal; what users must DO inside
// the solution comes second; everything else supports or corrects.
// W_STRONG_SUPPORT is a documented exception for options that are unambiguous
// system/automation tells even though their question is a supporting one.
export const W_GOAL = 3;
export const W_ACTION = 2;
export const W_SUPPORT = 1;
export const W_STRONG_SUPPORT = 2;

// Discovery signal points (uncertainty accumulator, not a bucket weight).
const DS_GOAL = 3; // "not sure" on the primary goal is the loudest uncertainty
const DS_STRONG = 2;

interface OptionEffect {
  weights?: SolutionWeights;
  discoverySignal?: number;
  // Explicitly neutral by design: the option carries no solution direction on
  // its own (it may still feed pain/lead tier or a conditional rule below).
  neutral?: true;
}

// ── Canonical option-effects table ───────────────────────────────────────────
// Every option of every structured question MUST appear here, with weights, a
// discoverySignal, or an explicit neutral marker. A completeness test iterates
// QUESTIONS against this table in both directions, so a copy edit that adds or
// renames an option fails loudly instead of dying silently.
export const OPTION_EFFECTS: Record<string, Record<string, OptionEffect>> = {
  primary_goal: {
    explain_business: { weights: { trust_website: W_GOAL } },
    generate_leads: { weights: { lead_flow_system: W_GOAL } },
    // Transactional default: selling routes to a rich converting site, not a
    // full app. Escalation to web_app happens only via system signals below.
    sell_online: { weights: { complex_website: W_GOAL } },
    digitize_manual_process: { weights: { ai_automation: W_GOAL, operations_crm: W_GOAL } },
    interactive_tool: { weights: { interactive_tool: W_GOAL } },
    user_system: { weights: { web_app: W_GOAL } },
    // "Upgrade" is a state, not a direction. It must not route by itself; its
    // meaning comes from the challenge combos in CONDITIONAL_RULES.
    upgrade_existing: { neutral: true },
    not_sure: { discoverySignal: DS_GOAL },
  },
  biggest_challenge: {
    unclear_value: { weights: { trust_website: W_SUPPORT } },
    site_not_converting: { weights: { lead_flow_system: W_SUPPORT } },
    manual_process: { weights: { ai_automation: W_SUPPORT, operations_crm: W_SUPPORT } },
    hard_to_explain: { weights: { complex_website: W_SUPPORT } },
    too_much_information: { weights: { complex_website: W_SUPPORT } },
    need_differentiated_experience: { weights: { complex_website: W_SUPPORT } },
    unshaped_product_idea: { discoverySignal: DS_STRONG },
    // Neutral by design: starting from zero says nothing about which solution
    // fits; the goal and desired actions decide.
    starting_from_zero: { neutral: true },
  },
  current_asset: {
    nothing: { weights: { trust_website: W_SUPPORT } },
    basic_site: { weights: { trust_website: W_SUPPORT } },
    site_needs_upgrade: { weights: { complex_website: W_SUPPORT } },
    existing_system: { weights: { web_app: W_STRONG_SUPPORT } }, // existing system = strong app tell
    // Neutral by design: a finished design says nothing about solution type;
    // readiness feeds the lead tier via urgency / desired_process instead.
    design_ready: { neutral: true },
    manual_process_to_digitize: { weights: { ai_automation: W_STRONG_SUPPORT, operations_crm: W_STRONG_SUPPORT } },
  },
  // P9a slice 2: current-workflow framing. Each option is what customers/staff do
  // today for the process to move forward; the deterministic scorer infers digital
  // direction from that. All are W_ACTION except exchange_documents (see OVERRIDE 1).
  user_actions: {
    understand_fit: { weights: { trust_website: W_ACTION } },
    contact_or_book: { weights: { lead_flow_system: W_ACTION } },
    buy_order_pay: { weights: { complex_website: W_ACTION } }, // transactional default
    get_recommendation: { weights: { interactive_tool: W_ACTION } },
    check_status: { weights: { web_app: W_ACTION } },
    // OVERRIDE 1 (Eyal's spec-gate ruling): doc exchange is a real portal signal but
    // not a decisive one. It maps W_SUPPORT (+1), not W_ACTION, so that web_app is not
    // the only bucket able to clear CONFIDENCE_FLOOR from user_actions alone.
    exchange_documents: { weights: { web_app: W_SUPPORT } },
    track_work: { weights: { operations_crm: W_ACTION } },
    process_information: { weights: { ai_automation: W_ACTION } },
  },
  urgency: {
    // All neutral by design: urgency feeds pain + lead tier, never the
    // solution direction.
    asap: { neutral: true },
    this_month: { neutral: true },
    next_months: { neutral: true },
    exploring: { neutral: true },
    depends_on_recommendation: { neutral: true },
  },
  desired_process: {
    short_focused: { weights: { lead_flow_system: W_SUPPORT } },
    // Neutral by design: a full process is seriousness (lead tier), not a
    // solution direction.
    full_process: { neutral: true },
    spec_first: { discoverySignal: DS_STRONG },
    // mvp / ongoing_product route to ai_automation only when combined with
    // automation signals (see CONDITIONAL_RULES); alone they are neutral.
    mvp: { neutral: true },
    ongoing_product: { neutral: true },
    // Same "state, not direction" rule as primary_goal.upgrade_existing.
    upgrade_existing: { neutral: true },
  },
};

function getSingle(answers: DiagnosticAnswers, questionId: string): string | undefined {
  const answer = answers[questionId];
  return answer?.type === 'single' ? answer.optionId : undefined;
}

function getMulti(answers: DiagnosticAnswers, questionId: string): string[] {
  const answer = answers[questionId];
  return answer?.type === 'multi' ? answer.optionIds : [];
}

function getText(answers: DiagnosticAnswers, questionId: string): string | undefined {
  const answer = answers[questionId];
  return answer?.type === 'text' ? answer.value : undefined;
}

// ── Conditional combo rules ──────────────────────────────────────────────────
// Upgrade intent (goal or process) is a state; the challenge says WHY the
// existing asset fails, and that pair decides direction. mvp/ongoing are
// commitment shapes that signal automation only when automation is present.
const UPGRADE_QUESTION_IDS = ['primary_goal', 'desired_process'] as const;

function hasUpgradeIntent(answers: DiagnosticAnswers): boolean {
  return UPGRADE_QUESTION_IDS.some((questionId) => getSingle(answers, questionId) === 'upgrade_existing');
}

// Manual-work backdrop shared by ai_automation and operations_crm, without the
// AI-specific tell. Used to gate the operations_crm combo rule below so it can
// never fire for a true web_app/portal case that has no manual-work backdrop.
function hasManualWorkContext(answers: DiagnosticAnswers): boolean {
  return (
    getSingle(answers, 'primary_goal') === 'digitize_manual_process' ||
    getSingle(answers, 'biggest_challenge') === 'manual_process' ||
    getSingle(answers, 'current_asset') === 'manual_process_to_digitize'
  );
}

function hasAutomationSignal(answers: DiagnosticAnswers): boolean {
  return (
    hasManualWorkContext(answers) ||
    getMulti(answers, 'user_actions').includes('process_information')
  );
}

interface ConditionalRule {
  // The answer this extra weight is attributed to in matchedSignals.
  questionId: string;
  optionId: string;
  when: (answers: DiagnosticAnswers) => boolean;
  weights: SolutionWeights;
  reasonHe: string;
}

export const CONDITIONAL_RULES: ConditionalRule[] = [
  {
    questionId: 'biggest_challenge',
    optionId: 'site_not_converting',
    when: (answers) =>
      hasUpgradeIntent(answers) && getSingle(answers, 'biggest_challenge') === 'site_not_converting',
    weights: { lead_flow_system: W_STRONG_SUPPORT, trust_website: W_SUPPORT },
    reasonHe: 'שדרוג אתר קיים שלא מביא פניות מכוון לתהליך לידים מסודר',
  },
  {
    questionId: 'biggest_challenge',
    optionId: 'hard_to_explain',
    when: (answers) =>
      hasUpgradeIntent(answers) && getSingle(answers, 'biggest_challenge') === 'hard_to_explain',
    weights: { complex_website: W_STRONG_SUPPORT },
    reasonHe: 'שדרוג אתר קיים עם שירות שקשה להסביר מכוון לאתר עשיר ומבודל',
  },
  {
    questionId: 'biggest_challenge',
    optionId: 'too_much_information',
    when: (answers) =>
      hasUpgradeIntent(answers) && getSingle(answers, 'biggest_challenge') === 'too_much_information',
    weights: { complex_website: W_STRONG_SUPPORT },
    reasonHe: 'שדרוג אתר קיים עם הרבה מידע מכוון לאתר עשיר ומאורגן',
  },
  {
    questionId: 'biggest_challenge',
    optionId: 'need_differentiated_experience',
    when: (answers) =>
      hasUpgradeIntent(answers) &&
      getSingle(answers, 'biggest_challenge') === 'need_differentiated_experience',
    weights: { complex_website: W_STRONG_SUPPORT },
    reasonHe: 'שדרוג אתר קיים לחוויה מבודלת מכוון לאתר עשיר ומעוצב',
  },
  {
    questionId: 'desired_process',
    optionId: 'mvp',
    when: (answers) => getSingle(answers, 'desired_process') === 'mvp' && hasAutomationSignal(answers),
    weights: { ai_automation: W_STRONG_SUPPORT },
    reasonHe: 'בקשת גרסה ראשונה יחד עם צורך באוטומציה מחזקת פתרון אוטומציה',
  },
  {
    questionId: 'desired_process',
    optionId: 'ongoing_product',
    when: (answers) =>
      getSingle(answers, 'desired_process') === 'ongoing_product' && hasAutomationSignal(answers),
    weights: { ai_automation: W_STRONG_SUPPORT },
    reasonHe: 'ליווי מתמשך יחד עם צורך באוטומציה מחזק פתרון אוטומציה',
  },
  // P9a slice 2: the old manage_process + use_dashboard operations combo is removed.
  // track_work (operations_crm +2) is now the explicit current-workflow signal, so no
  // replacement combo is added.
];

// ── Decision thresholds ──────────────────────────────────────────────────────
// CONFIDENCE_FLOOR: below this the top concrete bucket is too weak to trust.
// DISCOVERY_SIGNAL_THRESHOLD: at/above this, uncertainty counts as "strong".
// DOMINANCE_MARGIN / HIGH_CONFIDENCE_FLOOR: a concrete top beats strong
// uncertainty only when it clearly leads AND is at least as strong as the
// discovery signal itself, or is high in absolute terms. (P4d retune: with a
// single concrete bucket the margin holds by construction, so margin alone
// must not override a much larger uncertainty signal.)
export const CONFIDENCE_FLOOR = 4;
export const DISCOVERY_SIGNAL_THRESHOLD = 4;
export const DOMINANCE_MARGIN = 3;
export const HIGH_CONFIDENCE_FLOOR = 8;
export const SECONDARY_SOLUTION_MAX_GAP = 2;

export const CONCRETE_SOLUTIONS: SolutionType[] = SOLUTION_TYPES.filter(
  (solution) => solution !== 'discovery'
);

// Fixed tie-break order among concrete buckets (applied after the Q1-favored
// rule). Explicit constant so ranking never depends on object iteration order.
export const SOLUTION_PRIORITY_ORDER: SolutionType[] = [
  'operations_crm',
  'web_app',
  'complex_website',
  'lead_flow_system',
  'interactive_tool',
  'ai_automation',
  'trust_website',
  'discovery',
];

export interface ScoringTrace {
  solutionScores: SolutionScore;
  discoverySignal: number;
  matchedSignals: Record<SolutionType, MatchedSignal[]>;
  // Buckets that received points from primary_goal; used by the tie-break.
  goalFavoredSolutions: Set<SolutionType>;
}

function createEmptySolutionScore(): SolutionScore {
  const score = {} as SolutionScore;
  for (const solution of SOLUTION_TYPES) {
    score[solution] = 0;
  }
  return score;
}

function createEmptyMatchedSignals(): Record<SolutionType, MatchedSignal[]> {
  const signals = {} as Record<SolutionType, MatchedSignal[]>;
  for (const solution of SOLUTION_TYPES) {
    signals[solution] = [];
  }
  return signals;
}

export function scoreAnswers(answers: DiagnosticAnswers): ScoringTrace {
  const solutionScores = createEmptySolutionScore();
  const matchedSignals = createEmptyMatchedSignals();
  const goalFavoredSolutions = new Set<SolutionType>();
  let discoverySignal = 0;

  const applyEffect = (questionId: string, optionId: string) => {
    const effect = OPTION_EFFECTS[questionId]?.[optionId];
    if (!effect) return;
    if (effect.weights) {
      for (const [solution, weight] of Object.entries(effect.weights) as [SolutionType, number][]) {
        solutionScores[solution] += weight;
        matchedSignals[solution].push({ questionId, optionId, weight });
        if (questionId === 'primary_goal') goalFavoredSolutions.add(solution);
      }
    }
    if (effect.discoverySignal) {
      discoverySignal += effect.discoverySignal;
      matchedSignals.discovery.push({ questionId, optionId, weight: effect.discoverySignal });
    }
  };

  // Iterate the canonical question/option order, never the answers object's
  // insertion order (DB rows arrive unordered), so identical answer sets
  // always produce an identical matchedSignals trace.
  for (const question of QUESTIONS) {
    const answer = answers[question.id];
    if (!answer) continue;
    if (answer.type === 'single') {
      applyEffect(question.id, answer.optionId);
    } else if (answer.type === 'multi') {
      const selected = new Set(answer.optionIds);
      for (const option of question.options ?? []) {
        if (selected.has(option.id)) applyEffect(question.id, option.id);
      }
    }
    // text answers never score: personalization context only.
  }

  for (const rule of CONDITIONAL_RULES) {
    if (!rule.when(answers)) continue;
    for (const [solution, weight] of Object.entries(rule.weights) as [SolutionType, number][]) {
      solutionScores[solution] += weight;
      matchedSignals[solution].push({
        questionId: rule.questionId,
        optionId: rule.optionId,
        weight,
        reasonHe: rule.reasonHe,
      });
    }
  }

  // Expose the uncertainty accumulator as the discovery "score" so the
  // persisted snapshot stays transparent about why discovery could win.
  solutionScores.discovery = discoverySignal;

  return { solutionScores, discoverySignal, matchedSignals, goalFavoredSolutions };
}

// Scores-only helper, kept for callers that don't need the trace.
export function calculateSolutionScore(answers: DiagnosticAnswers): SolutionScore {
  return scoreAnswers(answers).solutionScores;
}

export function rankConcreteSolutions(
  scores: SolutionScore,
  goalFavoredSolutions: ReadonlySet<SolutionType> = new Set()
): SolutionType[] {
  return [...CONCRETE_SOLUTIONS].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    const favoredA = goalFavoredSolutions.has(a) ? 1 : 0;
    const favoredB = goalFavoredSolutions.has(b) ? 1 : 0;
    if (favoredA !== favoredB) return favoredB - favoredA;
    return SOLUTION_PRIORITY_ORDER.indexOf(a) - SOLUTION_PRIORITY_ORDER.indexOf(b);
  });
}

export function pickPrimaryAndSecondarySolution(
  scores: SolutionScore,
  discoverySignal: number,
  goalFavoredSolutions: ReadonlySet<SolutionType> = new Set()
): { primarySolution: SolutionType; secondarySolution?: SolutionType } {
  const ranked = rankConcreteSolutions(scores, goalFavoredSolutions);
  const [top, runnerUp] = ranked;

  if (scores[top] < CONFIDENCE_FLOOR) {
    return { primarySolution: 'discovery' };
  }

  const gap = scores[top] - scores[runnerUp];
  const dominant =
    (gap >= DOMINANCE_MARGIN && scores[top] >= discoverySignal) ||
    scores[top] >= HIGH_CONFIDENCE_FLOOR;
  if (discoverySignal >= DISCOVERY_SIGNAL_THRESHOLD && !dominant) {
    return { primarySolution: 'discovery' };
  }

  const hasSecondary = scores[runnerUp] > 0 && gap <= SECONDARY_SOLUTION_MAX_GAP;
  return hasSecondary ? { primarySolution: top, secondarySolution: runnerUp } : { primarySolution: top };
}

// ── Pain score (0..PAIN_SCORE_MAX): how much the current state hurts ─────────
// P4e: max achievable = challenge 2 + urgency 3 + process 2 = 7.
export const PAIN_SCORE_MAX = 7;

const CHALLENGE_PAIN_POINTS: Record<string, number> = {
  manual_process: 2,
  site_not_converting: 2,
  hard_to_explain: 1,
  too_much_information: 1,
};

const URGENCY_PAIN_POINTS: Record<string, number> = {
  asap: 3,
  this_month: 2,
  next_months: 1,
  depends_on_recommendation: 1,
  exploring: 0,
};

const PROCESS_SERIOUSNESS_PAIN_POINTS: Record<string, number> = {
  full_process: 2,
  mvp: 2,
  ongoing_product: 2,
  upgrade_existing: 1,
  short_focused: 1,
  spec_first: 1,
};

export function calculatePainScore(answers: DiagnosticAnswers): PainScore {
  const challenge = getSingle(answers, 'biggest_challenge');
  const urgency = getSingle(answers, 'urgency');
  const process = getSingle(answers, 'desired_process');
  const total =
    (challenge ? (CHALLENGE_PAIN_POINTS[challenge] ?? 0) : 0) +
    (urgency ? (URGENCY_PAIN_POINTS[urgency] ?? 0) : 0) +
    (process ? (PROCESS_SERIOUSNESS_PAIN_POINTS[process] ?? 0) : 0);
  return Math.min(PAIN_SCORE_MAX, total);
}

// ── Lead quality → tier. Separate dimension, independent of the buckets ──────
const URGENCY_LEAD_POINTS: Record<string, number> = {
  asap: 3,
  this_month: 2,
  next_months: 1,
  depends_on_recommendation: 1,
  exploring: 0,
};

const PROCESS_LEAD_POINTS: Record<string, number> = {
  full_process: 2,
  mvp: 2,
  ongoing_product: 2,
  upgrade_existing: 2,
  short_focused: 1,
  spec_first: 1,
};

// Any declared goal except "not sure" shows the lead knows what they want.
const CONCRETE_GOAL_LEAD_POINT = 1;

export function calculateLeadQualityScore(answers: DiagnosticAnswers): LeadQualityScore {
  const urgency = getSingle(answers, 'urgency');
  const process = getSingle(answers, 'desired_process');
  const goal = getSingle(answers, 'primary_goal');

  return (
    (urgency ? (URGENCY_LEAD_POINTS[urgency] ?? 0) : 0) +
    (process ? (PROCESS_LEAD_POINTS[process] ?? 0) : 0) +
    (goal && goal !== 'not_sure' ? CONCRETE_GOAL_LEAD_POINT : 0)
  );
}

// P4e: max lead score = urgency 3 + process 2 + concrete goal 1 = 6.
// Tier A at 5 means roughly "this month or sooner + serious process + concrete
// goal"; the old 6 would have demanded a perfect score.
export const LEAD_TIER_A_MIN = 5;
export const LEAD_TIER_B_MIN = 3;

export function classifyLeadTier(leadQualityScore: LeadQualityScore): LeadTier {
  if (leadQualityScore >= LEAD_TIER_A_MIN) return 'A';
  if (leadQualityScore >= LEAD_TIER_B_MIN) return 'B';
  return 'C';
}

export function calculateDiagnosticResult(answers: DiagnosticAnswers): DiagnosticResult {
  const trace = scoreAnswers(answers);
  const { primarySolution, secondarySolution } = pickPrimaryAndSecondarySolution(
    trace.solutionScores,
    trace.discoverySignal,
    trace.goalFavoredSolutions
  );
  const painScore = calculatePainScore(answers);
  const leadQualityScore = calculateLeadQualityScore(answers);
  const leadTier = classifyLeadTier(leadQualityScore);
  const resultTemplate = RESULT_TEMPLATES[primarySolution];

  return {
    primarySolution,
    secondarySolution,
    solutionScores: trace.solutionScores,
    discoverySignal: trace.discoverySignal,
    matchedSignals: trace.matchedSignals,
    painScore,
    leadQualityScore,
    leadTier,
    recommendedNextStep: resultTemplate.recommendedNextStepHe,
    resultTemplate,
  };
}

// Shared answer accessors, re-used by the personalization context builder.
export { getSingle as getSingleAnswer, getMulti as getMultiAnswers, getText as getTextAnswer };
