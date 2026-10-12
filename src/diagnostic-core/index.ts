export type {
  AnswerOption,
  AnswerValue,
  DiagnosticAnswers,
  DiagnosticResult,
  LeadQualityScore,
  LeadTier,
  MatchedSignal,
  PainScore,
  Question,
  QuestionType,
  ResultTemplate,
  SolutionScore,
  SolutionType,
} from './types.ts';
export { SOLUTION_TYPES, TOTAL_STAGES } from './types.ts';

export { QUESTIONS } from './questions.ts';
export { RESULT_TEMPLATES } from './resultTemplates.ts';
export { FIXTURES } from './fixtures.ts';

export {
  calculateDiagnosticResult,
  calculateLeadQualityScore,
  calculatePainScore,
  calculateSolutionScore,
  classifyLeadTier,
  pickPrimaryAndSecondarySolution,
} from './scoring.ts';

export type { PersonalizationContext } from './personalizationContext.ts';
export { buildPersonalizationContext } from './personalizationContext.ts';
