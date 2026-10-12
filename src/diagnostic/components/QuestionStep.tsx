import type { AnswerValue, Question } from '@/diagnostic-core/types';
import styles from './QuestionStep.module.css';

interface QuestionStepProps {
  question: Question;
  answer?: AnswerValue;
  onChange: (answer: AnswerValue) => void;
}

export default function QuestionStep({ question, answer, onChange }: QuestionStepProps) {
  return (
    <div className={styles.step}>
      <p className={styles.stageTitle}>{question.stageTitleHe}</p>
      {question.stageSubtitleHe && <p className={styles.stageSubtitle}>{question.stageSubtitleHe}</p>}
      <h2 className={styles.prompt}>{question.promptHe}</h2>
      {question.helpHe && <p className={styles.help}>{question.helpHe}</p>}

      {question.type === 'single' && (
        <div className={styles.options}>
          {question.options?.map((option) => (
            <label key={option.id} className={styles.option}>
              <input
                type="radio"
                name={question.id}
                checked={answer?.type === 'single' && answer.optionId === option.id}
                onChange={() => onChange({ type: 'single', optionId: option.id })}
              />
              {option.labelHe}
            </label>
          ))}
        </div>
      )}

      {question.type === 'multi' && (
        <div className={styles.options}>
          {question.options?.map((option) => {
            const selected = answer?.type === 'multi' && answer.optionIds.includes(option.id);
            const exclusiveId = question.exclusiveOptionId;
            return (
              <label key={option.id} className={styles.option}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const current = answer?.type === 'multi' ? answer.optionIds : [];
                    let next: string[];
                    if (selected) {
                      next = current.filter((id) => id !== option.id);
                    } else if (option.id === exclusiveId) {
                      // ponytail: exclusive option clears everything else (declared per question in questions.ts).
                      next = [option.id];
                    } else {
                      next = [...current.filter((id) => id !== exclusiveId), option.id];
                    }
                    onChange({ type: 'multi', optionIds: next });
                  }}
                />
                {option.labelHe}
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'textarea' && (
        <textarea
          className={styles.textarea}
          value={answer?.type === 'text' ? answer.value : ''}
          placeholder={question.placeholderHe}
          onChange={(e) => onChange({ type: 'text', value: e.target.value })}
        />
      )}
    </div>
  );
}
