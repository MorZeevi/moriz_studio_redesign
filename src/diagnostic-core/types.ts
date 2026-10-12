// Pure, portable types for the diagnostic core. No React/Next/Supabase/browser APIs.

export type QuestionType = 'single' | 'multi' | 'textarea';

export interface AnswerOption {
  id: string;
  labelHe: string;
}

// Stage ids group related topics and are independent of the question-based progress counter.
export const TOTAL_STAGES = 4;

export interface Question {
  id: string;
  type: QuestionType;
  promptHe: string;
  helpHe?: string;
  placeholderHe?: string;
  options?: AnswerOption[];
  required: boolean;
  stageId: number; // 0..TOTAL_STAGES
  stageTitleHe: string;
  stageSubtitleHe?: string;
  // multi only: selecting this option clears all others and vice versa (enforced in UI + validation).
  exclusiveOptionId?: string;
  // textarea only: minimum trimmed length required for the answer to count as complete.
  minLengthTrimmed?: number;
}

export type AnswerValue =
  | { type: 'single'; optionId: string }
  | { type: 'multi'; optionIds: string[] }
  | { type: 'text'; value: string };

export type DiagnosticAnswers = Record<string, AnswerValue>;

export const SOLUTION_TYPES = [
  'trust_website',
  'complex_website',
  'interactive_tool',
  'lead_flow_system',
  'web_app',
  'operations_crm',
  'ai_automation',
  'discovery',
] as const;

export type SolutionType = (typeof SOLUTION_TYPES)[number];

export type SolutionScore = Record<SolutionType, number>;
export type PainScore = number;
export type LeadQualityScore = number;
export type LeadTier = 'A' | 'B' | 'C';

// One scoring contribution: which answer added weight to a bucket, and why.
// reasonHe is set only when the option's own label is not self-explanatory
// (e.g. conditional combo rules); otherwise derive the label from QUESTIONS.
export interface MatchedSignal {
  questionId: string;
  optionId: string;
  weight: number;
  reasonHe?: string;
}

export interface ResultTemplate {
  solution: SolutionType;
  titleHe: string;
  shortDescriptionHe: string;
  whyHe: string;
  whatToIncludeHe: string[];
  whatNotToBuildNowHe: string[];
  recommendedNextStepHe: string;
}

export interface DiagnosticResult {
  primarySolution: SolutionType;
  secondarySolution?: SolutionType;
  solutionScores: SolutionScore;
  // Uncertainty accumulator, tracked separately from concrete bucket scores.
  discoverySignal: number;
  // Per-bucket scoring trace. Source of truth for "why this result" labels.
  matchedSignals: Record<SolutionType, MatchedSignal[]>;
  painScore: PainScore;
  leadQualityScore: LeadQualityScore;
  leadTier: LeadTier;
  recommendedNextStep: string;
  resultTemplate: ResultTemplate;
}
