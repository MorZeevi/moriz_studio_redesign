import type { SessionClassificationAction } from './api-types.ts';

const SESSION_CLASSIFICATION_ACTIONS = ['mark_test', 'restore_real'] as const satisfies readonly SessionClassificationAction[];

export function isSessionClassificationAction(value: unknown): value is SessionClassificationAction {
  return (
    typeof value === 'string' &&
    (SESSION_CLASSIFICATION_ACTIONS as readonly string[]).includes(value)
  );
}
