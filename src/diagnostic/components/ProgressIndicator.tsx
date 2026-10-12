import styles from './ProgressIndicator.module.css';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

// Question-based progress: every visible question receives one unique step number.
export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <p className={styles.progress}>
      שלב {currentStep + 1} מתוך {totalSteps}
    </p>
  );
}
