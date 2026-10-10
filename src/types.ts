// ─── Question Types ───────────────────────────────────────────────────────────

export type QuestionType = 'multiplication' | 'square' | 'cube';

export interface Question {
  id: string;
  type: QuestionType;
  operands: number[];        // [a, b] for multiplication, [a] for square/cube
  answer: number;
  display: string;           // e.g. "16 × 9", "17²", "7³"
}

// ─── Session / Attempt ───────────────────────────────────────────────────────

export interface QuestionAttempt {
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
  timeTakenMs: number;       // time from question shown to answer submitted
}

export interface SessionStats {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  accuracy: number;          // 0-100
  totalTimeMs: number;
  averageTimeMs: number;
  attempts: QuestionAttempt[];
}

// ─── Practice Mode ───────────────────────────────────────────────────────────

export type PracticeMode = 'multiplication' | 'squares-cubes' | 'mixed';

// ─── App Screen ───────────────────────────────────────────────────────────────

export type AppScreen = 'home' | 'quiz' | 'results';

// ─── Quiz State ───────────────────────────────────────────────────────────────

export type QuizPhase = 'answering' | 'feedback' | 'complete';

export interface QuizState {
  mode: PracticeMode;
  questionCount: number;       // 4-9, chosen on home screen
  questions: Question[];
  currentIndex: number;
  phase: QuizPhase;
  attempts: QuestionAttempt[];
  questionStartTime: number;   // performance.now() timestamp
  sessionStartTime: number;    // performance.now() timestamp
}
