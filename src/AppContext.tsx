import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppScreen, PracticeMode, QuizState, QuestionAttempt } from './types';
import { generateSession, checkAnswer, DEFAULT_QUESTIONS, MIN_QUESTIONS, MAX_QUESTIONS } from './logic';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  screen: AppScreen;
  quiz: QuizState | null;
  /** The question count chosen on the home screen (persists across sessions). */
  questionCount: number;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_QUESTION_COUNT'; count: number }
  | { type: 'START_QUIZ'; mode: PracticeMode }
  | { type: 'SUBMIT_ANSWER'; input: string }
  | { type: 'NEXT_QUESTION' }
  | { type: 'GO_HOME' }
  | { type: 'RESTART_QUIZ' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function initialQuiz(mode: PracticeMode, count: number): QuizState {
  const now = performance.now();
  return {
    mode,
    questionCount: count,
    questions: generateSession(mode, count),
    currentIndex: 0,
    phase: 'answering',
    attempts: [],
    questionStartTime: now,
    sessionStartTime: now,
  };
}

const INITIAL_STATE: AppState = {
  screen: 'home',
  quiz: null,
  questionCount: DEFAULT_QUESTIONS,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_QUESTION_COUNT': {
      const safe = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, action.count));
      return { ...state, questionCount: safe };
    }

    case 'START_QUIZ':
      return {
        screen: 'quiz',
        quiz: initialQuiz(action.mode, state.questionCount),
        questionCount: state.questionCount,
      };

    case 'SUBMIT_ANSWER': {
      const quiz = state.quiz!;
      if (quiz.phase !== 'answering') return state;

      const q = quiz.questions[quiz.currentIndex];
      const { isCorrect, parsed } = checkAnswer(q, action.input);
      const timeTakenMs = Math.round(performance.now() - quiz.questionStartTime);

      const attempt: QuestionAttempt = {
        question: q,
        userAnswer: parsed,
        isCorrect,
        timeTakenMs,
      };

      const newAttempts = [...quiz.attempts, attempt];
      const isLast = quiz.currentIndex === quiz.questions.length - 1;

      return {
        ...state,
        quiz: {
          ...quiz,
          phase: isLast ? 'complete' : 'feedback',
          attempts: newAttempts,
        },
      };
    }

    case 'NEXT_QUESTION': {
      const quiz = state.quiz!;
      if (quiz.phase === 'complete') {
        return { ...state, screen: 'results' };
      }
      if (quiz.phase !== 'feedback') return state;

      return {
        ...state,
        quiz: {
          ...quiz,
          currentIndex: quiz.currentIndex + 1,
          phase: 'answering',
          questionStartTime: performance.now(),
        },
      };
    }

    case 'GO_HOME':
      return { ...state, screen: 'home', quiz: null };

    case 'RESTART_QUIZ': {
      const mode = state.quiz?.mode ?? 'multiplication';
      return {
        ...state,
        screen: 'quiz',
        quiz: initialQuiz(mode, state.questionCount),
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  setQuestionCount: (count: number) => void;
  startQuiz: (mode: PracticeMode) => void;
  submitAnswer: (input: string) => void;
  nextQuestion: () => void;
  goHome: () => void;
  restartQuiz: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const setQuestionCount = useCallback(
    (count: number) => dispatch({ type: 'SET_QUESTION_COUNT', count }),
    []
  );
  const startQuiz = useCallback(
    (mode: PracticeMode) => dispatch({ type: 'START_QUIZ', mode }),
    []
  );
  const submitAnswer = useCallback(
    (input: string) => dispatch({ type: 'SUBMIT_ANSWER', input }),
    []
  );
  const nextQuestion = useCallback(() => dispatch({ type: 'NEXT_QUESTION' }), []);
  const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), []);
  const restartQuiz = useCallback(() => dispatch({ type: 'RESTART_QUIZ' }), []);

  return (
    <AppContext.Provider
      value={{ state, setQuestionCount, startQuiz, submitAnswer, nextQuestion, goHome, restartQuiz }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
