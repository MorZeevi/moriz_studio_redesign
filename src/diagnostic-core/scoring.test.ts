import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ADVERSARIAL_FIXTURES, FIXTURES } from './fixtures.ts';
import { QUESTIONS } from './questions.ts';
import { buildPersonalizationContext } from './personalizationContext.ts';
import {
  CONDITIONAL_RULES,
  CONFIDENCE_FLOOR,
  DISCOVERY_SIGNAL_THRESHOLD,
  HIGH_CONFIDENCE_FLOOR,
  OPTION_EFFECTS,
  PAIN_SCORE_MAX,
  calculateDiagnosticResult,
  calculateSolutionScore,
  classifyLeadTier,
  getMultiAnswers,
  getSingleAnswer,
  getTextAnswer,
  pickPrimaryAndSecondarySolution,
  scoreAnswers,
} from './scoring.ts';
import { SOLUTION_TYPES } from './types.ts';
import type { AnswerValue, DiagnosticAnswers, SolutionScore } from './types.ts';

function emptyScoreWith(overrides: Partial<SolutionScore>): SolutionScore {
  const score = {} as SolutionScore;
  for (const solution of SOLUTION_TYPES) score[solution] = 0;
  return { ...score, ...overrides };
}

function single(optionId: string): AnswerValue {
  return { type: 'single', optionId };
}

// ── Table integrity: copy edits to questions.ts must fail loudly ─────────────

const STRUCTURED_QUESTIONS = QUESTIONS.filter((q) => q.type === 'single' || q.type === 'multi');

test('every structured option has an entry in OPTION_EFFECTS', () => {
  for (const question of STRUCTURED_QUESTIONS) {
    const effects = OPTION_EFFECTS[question.id];
    assert.ok(effects, `no OPTION_EFFECTS entry for question "${question.id}"`);
    for (const option of question.options ?? []) {
      assert.ok(effects[option.id], `no effect for option "${question.id}.${option.id}"`);
    }
  }
});

test('OPTION_EFFECTS references only real questions and options', () => {
  for (const [questionId, effects] of Object.entries(OPTION_EFFECTS)) {
    const question = STRUCTURED_QUESTIONS.find((q) => q.id === questionId);
    assert.ok(question, `OPTION_EFFECTS references unknown question "${questionId}"`);
    for (const optionId of Object.keys(effects)) {
      assert.ok(
        question.options?.some((o) => o.id === optionId),
        `OPTION_EFFECTS references dead option "${questionId}.${optionId}"`
      );
    }
  }
});

test('every option effect declares exactly one shape', () => {
  for (const [questionId, effects] of Object.entries(OPTION_EFFECTS)) {
    for (const [optionId, effect] of Object.entries(effects)) {
      const shapes = [effect.weights, effect.discoverySignal, effect.neutral].filter(
        (value) => value !== undefined
      );
      assert.equal(
        shapes.length,
        1,
        `effect "${questionId}.${optionId}" must be exactly one of weights / discoverySignal / neutral`
      );
    }
  }
});

test('conditional rules reference real questions and options', () => {
  for (const rule of CONDITIONAL_RULES) {
    const question = QUESTIONS.find((q) => q.id === rule.questionId);
    assert.ok(question, `rule references unknown question "${rule.questionId}"`);
    assert.ok(
      question.options?.some((o) => o.id === rule.optionId),
      `rule references dead option "${rule.questionId}.${rule.optionId}"`
    );
    assert.ok(rule.reasonHe.length > 0, 'rule must carry a Hebrew reason');
  }
});

// ── Fixtures: one full answer set per bucket ─────────────────────────────────

test('each fixture produces its expected primary solution', () => {
  for (const solution of SOLUTION_TYPES) {
    const result = calculateDiagnosticResult(FIXTURES[solution]);
    assert.equal(
      result.primarySolution,
      solution,
      `fixture "${solution}" expected primary "${solution}", got "${result.primarySolution}"`
    );
  }
});

test('trust_website fixture scores match the weight table', () => {
  const trace = scoreAnswers(FIXTURES.trust_website);
  assert.equal(trace.solutionScores.trust_website, 7);
  assert.equal(trace.solutionScores.lead_flow_system, 1);
  assert.equal(trace.discoverySignal, 0);
});

test('complex_website fixture scores match the weight table', () => {
  const trace = scoreAnswers(FIXTURES.complex_website);
  // sell_online 3 + too_much_information 1 + site_needs_upgrade 1 + buy_order_pay 2 = 7.
  // No upgrade intent, so the too_much_information combo rule stays off.
  assert.equal(trace.solutionScores.complex_website, 7);
  assert.equal(trace.solutionScores.trust_website, 2); // understand_fit
  assert.equal(trace.discoverySignal, 0);
});

test('discovery fixture wins via the confidence floor, not concrete points', () => {
  const trace = scoreAnswers(FIXTURES.discovery);
  assert.equal(trace.discoverySignal, 7);
  assert.equal(trace.solutionScores.trust_website, 1);
  assert.ok(trace.solutionScores.trust_website < CONFIDENCE_FLOOR);
});

test('web_app fixture has no automation signal, so the ongoing_product rule stays off', () => {
  const trace = scoreAnswers(FIXTURES.web_app);
  assert.equal(trace.solutionScores.ai_automation, 0);
  assert.equal(trace.solutionScores.web_app, 8);
});

test('ai_automation fixture fires the mvp combo rule with its Hebrew reason', () => {
  const trace = scoreAnswers(FIXTURES.ai_automation);
  assert.equal(trace.solutionScores.ai_automation, 10);
  const reasons = trace.matchedSignals.ai_automation
    .map((signal) => signal.reasonHe)
    .filter(Boolean);
  assert.ok(reasons.includes('בקשת גרסה ראשונה יחד עם צורך באוטומציה מחזקת פתרון אוטומציה'));
});

// ── operations_crm: manual work with vs without an explicit AI signal ────────

test('operations_crm fixture: track_work ties ai_automation on 8 and wins by priority order', () => {
  const result = calculateDiagnosticResult(FIXTURES.operations_crm);
  const trace = scoreAnswers(FIXTURES.operations_crm);
  assert.equal(trace.solutionScores.operations_crm, 8);
  assert.equal(trace.solutionScores.ai_automation, 8);
  // P9a slice 2 removed the old manage_process + use_dashboard operations combo, so
  // operations_crm now carries only plain option weights and adds no reason line.
  const reasons = trace.matchedSignals.operations_crm.map((s) => s.reasonHe).filter(Boolean);
  assert.equal(reasons.length, 0);
  assert.equal(result.primarySolution, 'operations_crm');
  assert.equal(result.secondarySolution, 'ai_automation');
});

test('manual work with an explicit AI signal routes to ai_automation over operations_crm', () => {
  const result = calculateDiagnosticResult({
    primary_goal: single('digitize_manual_process'),
    biggest_challenge: single('manual_process'),
    current_asset: single('manual_process_to_digitize'),
    user_actions: { type: 'multi', optionIds: ['process_information'] },
    desired_process: single('mvp'),
  });
  assert.equal(result.primarySolution, 'ai_automation');
  assert.equal(result.solutionScores.ai_automation, 10);
  assert.equal(result.solutionScores.operations_crm, 6);
});

test('true web_app fixture scores no operations_crm points and stays web_app', () => {
  const trace = scoreAnswers(FIXTURES.web_app);
  assert.equal(trace.solutionScores.web_app, 8);
  assert.equal(trace.solutionScores.operations_crm, 0);
  // Runner-up is complex_website 1 (too_much_information base) -- a 7-point gap,
  // far beyond SECONDARY_SOLUTION_MAX_GAP, so no secondary is ever emitted here.
  assert.equal(trace.solutionScores.complex_website, 1);
  assert.ok(trace.solutionScores.web_app > trace.solutionScores.operations_crm);
  // check_status + exchange_documents route only to web_app; they never leak into ops.
  const reasons = trace.matchedSignals.operations_crm.map((s) => s.reasonHe).filter(Boolean);
  assert.equal(reasons.length, 0);
  assert.equal(calculateDiagnosticResult(FIXTURES.web_app).primarySolution, 'web_app');
});

test('ai_automation fixture now surfaces operations_crm as a close secondary', () => {
  const result = calculateDiagnosticResult(FIXTURES.ai_automation);
  assert.equal(result.primarySolution, 'ai_automation');
  assert.equal(result.solutionScores.operations_crm, 8);
  assert.equal(result.secondarySolution, 'operations_crm');
});

test('lead_flow_system, interactive_tool and discovery fixtures are unaffected by operations_crm', () => {
  for (const solution of ['lead_flow_system', 'interactive_tool', 'discovery'] as const) {
    const result = calculateDiagnosticResult(FIXTURES[solution]);
    assert.equal(result.primarySolution, solution);
    assert.equal(scoreAnswers(FIXTURES[solution]).solutionScores.operations_crm, 0);
  }
});

test('free-text answers never affect scoring', () => {
  const reworded: DiagnosticAnswers = {
    ...FIXTURES.trust_website,
    business_description: { type: 'text', value: 'עסק אחר לגמרי עם תיאור שונה לחלוטין' },
  };
  assert.deepEqual(
    calculateSolutionScore(reworded),
    calculateSolutionScore(FIXTURES.trust_website)
  );
});

test('scoreAnswers trace ignores answer insertion order and multi option order', () => {
  const answers = FIXTURES.web_app;
  const shuffled: DiagnosticAnswers = {};
  for (const [id, answer] of Object.entries(answers).reverse()) {
    shuffled[id] =
      answer.type === 'multi' ? { type: 'multi', optionIds: [...answer.optionIds].reverse() } : answer;
  }
  assert.deepEqual(scoreAnswers(shuffled), scoreAnswers(answers));
});

test('goal answers mark their buckets as goal-favored', () => {
  const trace = scoreAnswers(FIXTURES.lead_flow_system);
  assert.ok(trace.goalFavoredSolutions.has('lead_flow_system'));
  assert.equal(trace.goalFavoredSolutions.size, 1);
});

// ── pickPrimaryAndSecondarySolution: thresholds and tie-breaks ───────────────

test('top concrete score below the confidence floor falls back to discovery', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ trust_website: CONFIDENCE_FLOOR - 1 }),
    0
  );
  assert.equal(picked.primarySolution, 'discovery');
  assert.equal(picked.secondarySolution, undefined);
});

test('strong discovery signal without dominance falls back to discovery', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ lead_flow_system: 5, trust_website: 3 }),
    DISCOVERY_SIGNAL_THRESHOLD
  );
  assert.equal(picked.primarySolution, 'discovery');
});

test('a clear margin survives when the top also outweighs the discovery signal', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ lead_flow_system: 7, trust_website: 2 }),
    5
  );
  assert.equal(picked.primarySolution, 'lead_flow_system');
  assert.equal(picked.secondarySolution, undefined);
});

test('a dominant margin no longer survives a discovery signal larger than the top', () => {
  // P4d retune: gap 5 >= DOMINANCE_MARGIN, but top 6 < discoverySignal 13 and
  // top 6 < HIGH_CONFIDENCE_FLOOR, so strong uncertainty wins.
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ interactive_tool: 6, trust_website: 1 }),
    13
  );
  assert.equal(picked.primarySolution, 'discovery');
});

test('a high absolute score survives a strong discovery signal without a margin', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ lead_flow_system: HIGH_CONFIDENCE_FLOOR, trust_website: 7 }),
    9
  );
  assert.equal(picked.primarySolution, 'lead_flow_system');
  assert.equal(picked.secondarySolution, 'trust_website');
});

test('a close runner-up becomes the secondary solution', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ lead_flow_system: 5, web_app: 4 }),
    0
  );
  assert.equal(picked.primarySolution, 'lead_flow_system');
  assert.equal(picked.secondarySolution, 'web_app');
});

test('no secondary when the gap is large or the runner-up scored zero', () => {
  const largeGap = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ lead_flow_system: 5, web_app: 1 }),
    0
  );
  assert.equal(largeGap.primarySolution, 'lead_flow_system');
  assert.equal(largeGap.secondarySolution, undefined);
  const zeroRunnerUp = pickPrimaryAndSecondarySolution(emptyScoreWith({ trust_website: 5 }), 0);
  assert.equal(zeroRunnerUp.secondarySolution, undefined);
});

test('a tie resolves by the fixed priority order', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ trust_website: 5, ai_automation: 5 }),
    0
  );
  assert.equal(picked.primarySolution, 'ai_automation');
  assert.equal(picked.secondarySolution, 'trust_website');
});

test('a goal-favored solution wins a tie over the priority order', () => {
  const picked = pickPrimaryAndSecondarySolution(
    emptyScoreWith({ trust_website: 5, ai_automation: 5 }),
    0,
    new Set(['trust_website'])
  );
  assert.equal(picked.primarySolution, 'trust_website');
  assert.equal(picked.secondarySolution, 'ai_automation');
});

// ── Scenario coverage: the product decisions behind the weights ──────────────

test('selling online without system signals stays complex_website, not web_app', () => {
  const result = calculateDiagnosticResult({
    primary_goal: single('sell_online'),
    user_actions: { type: 'multi', optionIds: ['buy_order_pay'] },
  });
  assert.equal(result.primarySolution, 'complex_website');
});

test('system signals escalate a selling business to web_app', () => {
  const result = calculateDiagnosticResult({
    primary_goal: single('sell_online'),
    current_asset: single('existing_system'),
    user_actions: { type: 'multi', optionIds: ['check_status', 'exchange_documents'] },
  });
  assert.equal(result.primarySolution, 'web_app');
  assert.equal(result.secondarySolution, 'complex_website');
});

test('upgrade intent with a non-converting site routes to lead_flow_system', () => {
  const result = calculateDiagnosticResult({
    primary_goal: single('upgrade_existing'),
    user_actions: { type: 'multi', optionIds: ['contact_or_book'] },
    biggest_challenge: single('site_not_converting'),
  });
  assert.equal(result.primarySolution, 'lead_flow_system');
  const reasons = result.matchedSignals.lead_flow_system.map((s) => s.reasonHe).filter(Boolean);
  assert.ok(reasons.includes('שדרוג אתר קיים שלא מביא פניות מכוון לתהליך לידים מסודר'));
});

test('upgrade intent with too much information routes to complex_website', () => {
  const result = calculateDiagnosticResult({
    primary_goal: single('upgrade_existing'),
    biggest_challenge: single('too_much_information'),
    current_asset: single('site_needs_upgrade'),
  });
  assert.equal(result.primarySolution, 'complex_website');
  const reasons = result.matchedSignals.complex_website.map((s) => s.reasonHe).filter(Boolean);
  assert.ok(reasons.includes('שדרוג אתר קיים עם הרבה מידע מכוון לאתר עשיר ומאורגן'));
});

test('with the same upgrade base, the challenge alone flips the recommendation', () => {
  const base: DiagnosticAnswers = {
    primary_goal: single('upgrade_existing'),
    user_actions: { type: 'multi', optionIds: ['contact_or_book'] },
    current_asset: single('site_needs_upgrade'),
  };
  const notConverting = calculateDiagnosticResult({
    ...base,
    biggest_challenge: single('site_not_converting'),
  });
  const tooMuchInfo = calculateDiagnosticResult({
    ...base,
    biggest_challenge: single('too_much_information'),
  });
  assert.equal(notConverting.primarySolution, 'lead_flow_system');
  assert.equal(tooMuchInfo.primarySolution, 'complex_website');
});

test('the upgrade combo rules stay off without upgrade intent', () => {
  const trace = scoreAnswers({
    primary_goal: single('generate_leads'),
    biggest_challenge: single('site_not_converting'),
  });
  // Base weights only: goal 3 + challenge 1. The +2/+1 combo must not fire.
  assert.equal(trace.solutionScores.lead_flow_system, 4);
  assert.equal(trace.solutionScores.trust_website, 0);
});

test('early idea with tool-shaped answers routes to discovery, not interactive_tool', () => {
  // P9a slice 2: a single get_recommendation lifts interactive_tool to 2, below
  // CONFIDENCE_FLOOR, so discovery wins on the floor while discoverySignal (7) piles
  // up from not_sure + unshaped_product_idea + spec_first.
  const result = calculateDiagnosticResult({
    primary_goal: single('not_sure'),
    biggest_challenge: single('unshaped_product_idea'),
    current_asset: single('nothing'),
    user_actions: { type: 'multi', optionIds: ['get_recommendation'] },
    urgency: single('exploring'),
    desired_process: single('spec_first'),
  });
  assert.equal(result.primarySolution, 'discovery');
  assert.equal(result.discoverySignal, 7);
  assert.equal(result.solutionScores.interactive_tool, 2);
});

test('a tool goal with a matching recommendation action routes to interactive_tool', () => {
  // interactive_tool goal (3) + get_recommendation (2) = 5, clear of the floor with
  // no discovery signal, so the concrete tool direction wins outright.
  const result = calculateDiagnosticResult({
    primary_goal: single('interactive_tool'),
    user_actions: { type: 'multi', optionIds: ['get_recommendation'] },
  });
  assert.equal(result.primarySolution, 'interactive_tool');
  assert.equal(result.discoverySignal, 0);
  assert.equal(result.solutionScores.interactive_tool, 5);
});

test('an unshaped product idea keeps tool-shaped answers in discovery', () => {
  // discoverySignal 5 (not_sure + unshaped_product_idea) with interactive_tool at just
  // 2 (below the floor): discovery wins. The signal-crossing path itself is covered by
  // the pickPrimaryAndSecondarySolution unit tests above.
  const result = calculateDiagnosticResult({
    primary_goal: single('not_sure'),
    biggest_challenge: single('unshaped_product_idea'),
    user_actions: { type: 'multi', optionIds: ['get_recommendation'] },
  });
  assert.equal(result.primarySolution, 'discovery');
  assert.equal(result.discoverySignal, 5);
  assert.equal(result.solutionScores.interactive_tool, 2);
});

// ── user_actions current-workflow table (P9a slice 2) ────────────────────────
// The reworded user_actions options are the slice's core change: each is what
// customers/staff do today, and the deterministic scorer infers direction from
// them. These guard the weight table against a copy edit or an accidental re-weight.

// Declared per-option weight, one bucket each, W_ACTION (2) except exchange_documents,
// the OVERRIDE-1 supporting signal (web_app +1).
const USER_ACTION_WEIGHTS: Record<string, Partial<SolutionScore>> = {
  understand_fit: { trust_website: 2 },
  contact_or_book: { lead_flow_system: 2 },
  buy_order_pay: { complex_website: 2 },
  get_recommendation: { interactive_tool: 2 },
  check_status: { web_app: 2 },
  exchange_documents: { web_app: 1 },
  track_work: { operations_crm: 2 },
  process_information: { ai_automation: 2 },
};

function userActionsScore(optionIds: string[]): SolutionScore {
  return scoreAnswers({ user_actions: { type: 'multi', optionIds } }).solutionScores;
}

test('user_actions options in questions.ts exactly match the declared weight table', () => {
  const userActions = QUESTIONS.find((q) => q.id === 'user_actions');
  assert.ok(userActions, 'user_actions question is missing');
  const optionIds = (userActions.options ?? []).map((o) => o.id);
  assert.deepEqual([...optionIds].sort(), Object.keys(USER_ACTION_WEIGHTS).sort());
});

test('user_actions weights stack additively across every non-empty subset, regardless of order', () => {
  const optionIds = Object.keys(USER_ACTION_WEIGHTS);
  for (let mask = 1; mask < 1 << optionIds.length; mask++) {
    const subset = optionIds.filter((_, i) => mask & (1 << i));
    const forward = userActionsScore(subset);
    const reversed = userActionsScore([...subset].reverse());
    assert.deepEqual(reversed, forward, `subset ${subset.join('+')} is order-dependent`);
    for (const solution of SOLUTION_TYPES) {
      const expected = subset.reduce((sum, id) => sum + (USER_ACTION_WEIGHTS[id][solution] ?? 0), 0);
      assert.equal(forward[solution], expected, `subset ${subset.join('+')} -> ${solution}`);
      assert.ok(
        Number.isInteger(forward[solution]) && forward[solution] >= 0,
        'scores stay finite non-negative integers'
      );
    }
  }
});

test('all eight user_actions together produce the OVERRIDE-4 delta', () => {
  const scores = userActionsScore(Object.keys(USER_ACTION_WEIGHTS));
  assert.equal(scores.trust_website, 2);
  assert.equal(scores.lead_flow_system, 2);
  assert.equal(scores.complex_website, 2);
  assert.equal(scores.interactive_tool, 2);
  assert.equal(scores.web_app, 3); // check_status 2 + exchange_documents 1 (OVERRIDE 1)
  assert.equal(scores.operations_crm, 2);
  assert.equal(scores.ai_automation, 2);
  assert.equal(scores.discovery, 0);
});

test('goal + matching current-workflow action lands on the intended primary solution', () => {
  const matrix = [
    { goal: 'explain_business', action: 'understand_fit', primary: 'trust_website' },
    { goal: 'generate_leads', action: 'contact_or_book', primary: 'lead_flow_system' },
    { goal: 'sell_online', action: 'buy_order_pay', primary: 'complex_website' },
    { goal: 'interactive_tool', action: 'get_recommendation', primary: 'interactive_tool' },
    { goal: 'user_system', action: 'check_status', primary: 'web_app' },
    { goal: 'user_system', action: 'exchange_documents', primary: 'web_app' },
    { goal: 'digitize_manual_process', action: 'track_work', primary: 'operations_crm' },
    { goal: 'digitize_manual_process', action: 'process_information', primary: 'ai_automation' },
  ];
  for (const { goal, action, primary } of matrix) {
    const result = calculateDiagnosticResult({
      primary_goal: single(goal),
      user_actions: { type: 'multi', optionIds: [action] },
    });
    assert.equal(result.primarySolution, primary, `${goal} + ${action} -> ${primary}`);
    // No dead user_actions id may surface anywhere in the trace.
    for (const signals of Object.values(result.matchedSignals)) {
      for (const signal of signals) {
        if (signal.questionId === 'user_actions') {
          assert.ok(USER_ACTION_WEIGHTS[signal.optionId], `dead user_actions id ${signal.optionId} in trace`);
        }
      }
    }
  }
});

// P9a slice 2 §C.5 item 5: the all-eight-actions selection against each named
// context must still land on the goal-driven primary. Every workflow option adds
// to a different bucket, so the context (goal/challenge/asset/process) — not the
// uniform workflow noise — decides the recommendation. Asserts the primary only;
// the exact web score differs by OVERRIDE 1 but never flips these primaries.
test('all-eight workflow selection lands on the intended primary for every named context', () => {
  const allActions = Object.keys(USER_ACTION_WEIGHTS);
  const contexts = [
    { label: 'explain business', primary_goal: 'explain_business', biggest_challenge: 'starting_from_zero', current_asset: 'design_ready', desired_process: 'full_process', primary: 'trust_website' },
    { label: 'generate leads', primary_goal: 'generate_leads', biggest_challenge: 'starting_from_zero', current_asset: 'design_ready', desired_process: 'full_process', primary: 'lead_flow_system' },
    { label: 'sell online', primary_goal: 'sell_online', biggest_challenge: 'starting_from_zero', current_asset: 'design_ready', desired_process: 'full_process', primary: 'complex_website' },
    { label: 'manual operations', primary_goal: 'digitize_manual_process', biggest_challenge: 'manual_process', current_asset: 'manual_process_to_digitize', desired_process: 'full_process', primary: 'operations_crm' },
    { label: 'interactive outcome', primary_goal: 'interactive_tool', biggest_challenge: 'starting_from_zero', current_asset: 'design_ready', desired_process: 'full_process', primary: 'interactive_tool' },
    { label: 'ongoing user system', primary_goal: 'user_system', biggest_challenge: 'starting_from_zero', current_asset: 'existing_system', desired_process: 'full_process', primary: 'web_app' },
    { label: 'existing site not converting', primary_goal: 'upgrade_existing', biggest_challenge: 'site_not_converting', current_asset: 'site_needs_upgrade', desired_process: 'upgrade_existing', primary: 'lead_flow_system' },
    { label: 'unshaped idea', primary_goal: 'not_sure', biggest_challenge: 'unshaped_product_idea', current_asset: 'nothing', desired_process: 'spec_first', primary: 'discovery' },
  ];
  for (const ctx of contexts) {
    const answers: DiagnosticAnswers = {
      primary_goal: single(ctx.primary_goal),
      biggest_challenge: single(ctx.biggest_challenge),
      current_asset: single(ctx.current_asset),
      desired_process: single(ctx.desired_process),
      urgency: single('exploring'),
      user_actions: { type: 'multi', optionIds: allActions },
    };
    const result = calculateDiagnosticResult(answers);
    assert.equal(result.primarySolution, ctx.primary, `${ctx.label} -> ${ctx.primary}`);
    // Item 6: every solution score is a finite non-negative integer.
    const { solutionScores } = scoreAnswers(answers);
    for (const solution of SOLUTION_TYPES) {
      assert.ok(
        Number.isInteger(solutionScores[solution]) && solutionScores[solution] >= 0,
        `${ctx.label}: ${solution} is not a finite non-negative integer`
      );
    }
    // Item 6: no unmatched/dead user_actions id may enter the trace.
    for (const signals of Object.values(result.matchedSignals)) {
      for (const signal of signals) {
        if (signal.questionId === 'user_actions') {
          assert.ok(USER_ACTION_WEIGHTS[signal.optionId], `${ctx.label}: dead user_actions id ${signal.optionId}`);
        }
      }
    }
  }
});

// P9a slice 2 §C.3: the documented per-bucket maxima are a hard ceiling. Rather
// than hand-pick one maximizing answer set, brute-force every
// goal x challenge x asset x desired_process with all eight workflow actions
// selected — all-eight is simultaneously optimal for every bucket because each
// action only ever adds to its own bucket — and confirm the observed maximum
// equals the documented value. web_app is 8, not the spec's pre-OVERRIDE 9,
// because exchange_documents is a +1 support signal under OVERRIDE 1 (see :434).
const DOCUMENTED_MAXIMA: SolutionScore = {
  trust_website: 7,
  lead_flow_system: 8,
  complex_website: 9,
  interactive_tool: 5,
  web_app: 8,
  operations_crm: 8,
  ai_automation: 10,
  discovery: 7,
};

test('no answer set pushes any bucket past its documented C.3 maximum', () => {
  const optionsFor = (id: string) => (QUESTIONS.find((q) => q.id === id)?.options ?? []).map((o) => o.id);
  const goals = optionsFor('primary_goal');
  const challenges = optionsFor('biggest_challenge');
  const assets = optionsFor('current_asset');
  const processes = optionsFor('desired_process');
  const allActions = Object.keys(USER_ACTION_WEIGHTS);

  const observed = emptyScoreWith({});
  for (const goal of goals) {
    for (const challenge of challenges) {
      for (const asset of assets) {
        for (const process of processes) {
          const { solutionScores } = scoreAnswers({
            primary_goal: single(goal),
            biggest_challenge: single(challenge),
            current_asset: single(asset),
            desired_process: single(process),
            user_actions: { type: 'multi', optionIds: allActions },
          });
          for (const solution of SOLUTION_TYPES) {
            if (solutionScores[solution] > observed[solution]) observed[solution] = solutionScores[solution];
          }
        }
      }
    }
  }
  assert.deepEqual(observed, DOCUMENTED_MAXIMA);
});

// P9a slice 2 §M.2: a current-workflow signal must never overpower the declared goal.
test('a web-shaped workflow cannot invent confidence the goal lacks', () => {
  const trace = scoreAnswers(ADVERSARIAL_FIXTURES.workflow_cannot_override_goal);
  const result = calculateDiagnosticResult(ADVERSARIAL_FIXTURES.workflow_cannot_override_goal);
  assert.equal(trace.solutionScores.lead_flow_system, 3);
  assert.equal(trace.solutionScores.web_app, 3);
  assert.equal(result.primarySolution, 'discovery'); // top 3 < CONFIDENCE_FLOOR
  assert.equal(result.secondarySolution, undefined);
});

test('the declared goal wins as primary with the web workflow only as a close secondary', () => {
  const trace = scoreAnswers(ADVERSARIAL_FIXTURES.goal_survives_with_workflow_secondary);
  const result = calculateDiagnosticResult(ADVERSARIAL_FIXTURES.goal_survives_with_workflow_secondary);
  assert.equal(trace.solutionScores.lead_flow_system, 4);
  assert.equal(trace.solutionScores.web_app, 3);
  assert.equal(result.primarySolution, 'lead_flow_system');
  assert.equal(result.secondarySolution, 'web_app');
});

// ── Lead tier and pain: independent of the solution direction ────────────────

test('classifyLeadTier boundaries for A/B/C', () => {
  assert.equal(classifyLeadTier(6), 'A');
  assert.equal(classifyLeadTier(5), 'A');
  assert.equal(classifyLeadTier(4), 'B');
  assert.equal(classifyLeadTier(3), 'B');
  assert.equal(classifyLeadTier(2), 'C');
  assert.equal(classifyLeadTier(0), 'C');
});

test('fixture lead tiers span the range', () => {
  assert.equal(calculateDiagnosticResult(FIXTURES.lead_flow_system).leadTier, 'A');
  assert.equal(calculateDiagnosticResult(FIXTURES.ai_automation).leadTier, 'A');
  assert.equal(calculateDiagnosticResult(FIXTURES.trust_website).leadTier, 'B');
  assert.equal(calculateDiagnosticResult(FIXTURES.discovery).leadTier, 'C');
});

test('readiness changes the lead tier without changing the recommendation', () => {
  const eager = calculateDiagnosticResult(FIXTURES.trust_website);
  const hesitant = calculateDiagnosticResult({
    ...FIXTURES.trust_website,
    urgency: single('exploring'),
    desired_process: single('spec_first'),
  });
  assert.equal(hesitant.primarySolution, eager.primarySolution);
  assert.equal(eager.leadTier, 'B');
  assert.equal(hesitant.leadTier, 'C');
});

test('pain score reflects challenge, urgency and process seriousness, capped', () => {
  assert.equal(calculateDiagnosticResult(FIXTURES.ai_automation).painScore, 7);
  assert.equal(calculateDiagnosticResult(FIXTURES.trust_website).painScore, 3);
  for (const solution of SOLUTION_TYPES) {
    const { painScore } = calculateDiagnosticResult(FIXTURES[solution]);
    assert.ok(painScore >= 0 && painScore <= PAIN_SCORE_MAX);
  }
});

// ── Personalization context: the P5 AI input contract ────────────────────────

test('buildPersonalizationContext exposes the decided result and Hebrew labels', () => {
  const answers = FIXTURES.trust_website;
  const result = calculateDiagnosticResult(answers);
  const context = buildPersonalizationContext(answers, result);

  assert.equal(context.businessDescription, 'קליניקה קטנה לטיפולי פנים ברמת גן');
  assert.equal(context.primarySolution, 'trust_website');
  assert.equal(context.resultTitleHe, result.resultTemplate.titleHe);
  assert.equal(context.leadTier, result.leadTier);
  assert.equal(context.painScore, result.painScore);
  assert.ok(context.primaryGoalHe && context.primaryGoalHe.length > 0);
  assert.equal(context.userActionsHe.length, 1);
  assert.deepEqual(context.winningSignals, result.matchedSignals.trust_website);
});

test('reason labels come only from the winning bucket, deduped', () => {
  const answers = FIXTURES.ai_automation;
  const result = calculateDiagnosticResult(answers);
  const context = buildPersonalizationContext(answers, result);

  assert.ok(
    context.reasonLabelsHe.includes('בקשת גרסה ראשונה יחד עם צורך באוטומציה מחזקת פתרון אוטומציה')
  );
  assert.equal(new Set(context.reasonLabelsHe).size, context.reasonLabelsHe.length);

  // Every label must trace back to a winning-bucket signal (its rule reason or
  // its option's Hebrew label). Nothing from losing buckets may leak in.
  const allowed = new Set(
    context.winningSignals.flatMap((signal) => {
      const question = QUESTIONS.find((q) => q.id === signal.questionId);
      const label = question?.options?.find((o) => o.id === signal.optionId)?.labelHe;
      return [signal.reasonHe, label].filter((value): value is string => Boolean(value));
    })
  );
  for (const label of context.reasonLabelsHe) {
    assert.ok(allowed.has(label), `reason label "${label}" is not from the winning bucket`);
  }
});

test('buildPersonalizationContext handles missing answers gracefully', () => {
  const result = calculateDiagnosticResult({});
  assert.equal(result.primarySolution, 'discovery');
  const context = buildPersonalizationContext({}, result);
  assert.equal(context.businessDescription, undefined);
  assert.equal(context.primaryGoalHe, undefined);
  assert.deepEqual(context.userActionsHe, []);
  assert.deepEqual(context.winningSignals, []);
  assert.deepEqual(context.reasonLabelsHe, []);
  assert.ok(context.resultTitleHe.length > 0);
});

test('free text is trimmed and capped, and whitespace-only becomes undefined', () => {
  const answers: DiagnosticAnswers = {
    ...FIXTURES.trust_website,
    business_description: { type: 'text', value: ` ${'א'.repeat(2500)} ` },
  };
  const context = buildPersonalizationContext(answers, calculateDiagnosticResult(answers));
  assert.equal(context.businessDescription?.length, 2000);
  const whitespaceOnly = buildPersonalizationContext(
    { ...answers, business_description: { type: 'text', value: '   ' } },
    calculateDiagnosticResult(answers)
  );
  assert.equal(whitespaceOnly.businessDescription, undefined);
});

test('buildPersonalizationContext does not mutate the result', () => {
  const result = calculateDiagnosticResult(FIXTURES.web_app);
  const snapshot = JSON.stringify(result);
  buildPersonalizationContext(FIXTURES.web_app, result);
  assert.equal(JSON.stringify(result), snapshot);
});

// ── currentAssetHe extension (P5b): regression + new-field coverage ──────────
// Every pre-existing PersonalizationContext field must stay byte-identical
// after the additive currentAssetHe field was introduced. Pinned against
// independently-derived expected values (QUESTIONS labels, the already-tested
// DiagnosticResult), never by re-running buildPersonalizationContext and
// diffing it against itself.

function expectedOptionLabel(questionId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const question = QUESTIONS.find((q) => q.id === questionId);
  return question?.options?.find((o) => o.id === optionId)?.labelHe;
}

test('every pre-existing PersonalizationContext field is unaffected by the currentAssetHe extension, across all 8 fixtures', () => {
  for (const solution of SOLUTION_TYPES) {
    const answers = FIXTURES[solution];
    const result = calculateDiagnosticResult(answers);
    const context = buildPersonalizationContext(answers, result);

    assert.equal(
      context.businessDescription,
      getTextAnswer(answers, 'business_description')?.trim(),
      `businessDescription mismatch for ${solution}`
    );
    assert.equal(
      context.primaryGoalHe,
      expectedOptionLabel('primary_goal', getSingleAnswer(answers, 'primary_goal')),
      `primaryGoalHe mismatch for ${solution}`
    );
    assert.equal(
      context.biggestChallengeHe,
      expectedOptionLabel('biggest_challenge', getSingleAnswer(answers, 'biggest_challenge')),
      `biggestChallengeHe mismatch for ${solution}`
    );
    assert.deepEqual(
      context.userActionsHe,
      getMultiAnswers(answers, 'user_actions')
        .map((optionId) => expectedOptionLabel('user_actions', optionId))
        .filter((label): label is string => Boolean(label)),
      `userActionsHe mismatch for ${solution}`
    );
    assert.equal(
      context.urgencyHe,
      expectedOptionLabel('urgency', getSingleAnswer(answers, 'urgency')),
      `urgencyHe mismatch for ${solution}`
    );
    assert.equal(
      context.desiredProcessHe,
      expectedOptionLabel('desired_process', getSingleAnswer(answers, 'desired_process')),
      `desiredProcessHe mismatch for ${solution}`
    );
    assert.equal(context.primarySolution, result.primarySolution, `primarySolution mismatch for ${solution}`);
    assert.equal(context.secondarySolution, result.secondarySolution, `secondarySolution mismatch for ${solution}`);
    assert.equal(context.resultTitleHe, result.resultTemplate.titleHe, `resultTitleHe mismatch for ${solution}`);
    assert.equal(context.leadTier, result.leadTier, `leadTier mismatch for ${solution}`);
    assert.equal(context.painScore, result.painScore, `painScore mismatch for ${solution}`);
    assert.deepEqual(
      context.winningSignals,
      result.matchedSignals[result.primarySolution] ?? [],
      `winningSignals mismatch for ${solution}`
    );

    const expectedReasonLabelsHe = [
      ...new Set(
        (result.matchedSignals[result.primarySolution] ?? [])
          .map((signal) => signal.reasonHe ?? expectedOptionLabel(signal.questionId, signal.optionId))
          .filter((label): label is string => Boolean(label))
      ),
    ];
    assert.deepEqual(context.reasonLabelsHe, expectedReasonLabelsHe, `reasonLabelsHe mismatch for ${solution}`);
  }
});

test('currentAssetHe is populated from the current_asset answer label, across all 8 fixtures', () => {
  for (const solution of SOLUTION_TYPES) {
    const answers = FIXTURES[solution];
    const context = buildPersonalizationContext(answers, calculateDiagnosticResult(answers));
    assert.equal(
      context.currentAssetHe,
      expectedOptionLabel('current_asset', getSingleAnswer(answers, 'current_asset')),
      `currentAssetHe mismatch for ${solution}`
    );
    assert.ok(context.currentAssetHe, `currentAssetHe should be populated for ${solution}`);
  }
});

test('currentAssetHe is undefined when current_asset is unanswered', () => {
  const context = buildPersonalizationContext({}, calculateDiagnosticResult({}));
  assert.equal(context.currentAssetHe, undefined);
});
