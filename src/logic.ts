import type { PracticeMode, Question, QuestionType } from './types';

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns a cryptographically random integer in [min, max] inclusive.
 */
function randInt(min: number, max: number): number {
  const range = max - min + 1;
  // Use crypto.getRandomValues for unbiased randomness when available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    // Rejection sampling to avoid modulo bias
    const limit = Math.floor(0x100000000 / range) * range;
    let v: number;
    do {
      crypto.getRandomValues(arr);
      v = arr[0];
    } while (v >= limit);
    return min + (v % range);
  }
  return min + Math.floor(Math.random() * range);
}

/**
 * Fisher–Yates shuffle (in-place). Returns the same array.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sample `count` unique items from [min, max] inclusive, without replacement.
 */
function sampleRange(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  shuffle(pool);
  return pool.slice(0, count);
}

/** Unique ID generator */
let _idCounter = 0;
function nextId(): string {
  return `q-${Date.now()}-${++_idCounter}`;
}

// ─── Question Factories ───────────────────────────────────────────────────────

function makeMultiplication(a: number, b: number): Question {
  return {
    id: nextId(),
    type: 'multiplication',
    operands: [a, b],
    answer: a * b,
    display: `${a} \u00D7 ${b}`,
  };
}

function makeSquare(a: number): Question {
  return {
    id: nextId(),
    type: 'square',
    operands: [a],
    answer: a * a,
    display: `${a}\u00B2`,
  };
}

function makeCube(a: number): Question {
  return {
    id: nextId(),
    type: 'cube',
    operands: [a],
    answer: a * a * a,
    display: `${a}\u00B3`,
  };
}

// ─── Session Generators ───────────────────────────────────────────────────────

/** Generate `count` unique multiplication questions (a in [9,25], b in [1,10]). */
function generateMultiplicationSession(count: number): Question[] {
  const A_MIN = 9, A_MAX = 25;
  const B_MIN = 1, B_MAX = 10;
  // Total unique pairs = 17 * 10 = 170, always > count

  const used = new Set<string>();
  const questions: Question[] = [];

  while (questions.length < count) {
    const a = randInt(A_MIN, A_MAX);
    const b = randInt(B_MIN, B_MAX);
    const key = `${a}x${b}`;
    if (!used.has(key)) {
      used.add(key);
      questions.push(makeMultiplication(a, b));
    }
  }

  return shuffle(questions);
}

/** Generate `count` square questions (a in [15,25]).
 *  Up to 11 unique; beyond that repeats are allowed (good for drill). */
function generateSquareQuestions(count: number): Question[] {
  const A_MIN = 15, A_MAX = 25;   // 11 unique values
  const POOL = A_MAX - A_MIN + 1;
  if (count <= POOL) {
    return sampleRange(A_MIN, A_MAX, count).map(makeSquare);
  }
  // More questions than unique bases — allow repeats
  return Array.from({ length: count }, () => makeSquare(randInt(A_MIN, A_MAX)));
}

/** Generate `count` cube questions (a in [3,15]).
 *  Up to 13 unique; beyond that repeats are allowed. */
function generateCubeQuestions(count: number): Question[] {
  const A_MIN = 3, A_MAX = 15;    // 13 unique values
  const POOL = A_MAX - A_MIN + 1;
  if (count <= POOL) {
    return sampleRange(A_MIN, A_MAX, count).map(makeCube);
  }
  return Array.from({ length: count }, () => makeCube(randInt(A_MIN, A_MAX)));
}

/**
 * Generate `count` questions split as evenly as possible between squares and
 * cubes. For odd counts the extra question type is chosen randomly.
 */
function generateSquaresCubesSession(count: number): Question[] {
  const half = Math.floor(count / 2);
  const rem = count - half * 2; // 0 or 1
  // Decide which type gets the extra question when count is odd
  const sqCount = half + (rem > 0 ? randInt(0, 1) : 0);
  const cubeCount = count - sqCount;
  const squares = generateSquareQuestions(sqCount);
  const cubes = generateCubeQuestions(cubeCount);
  return shuffle([...squares, ...cubes]);
}

/**
 * Generate `count` mixed questions (min 1 of each type). Extras are
 * distributed randomly with a per-type cap to prevent domination.
 */
function generateMixedSession(count: number): Question[] {
  // Start with 1 of each type (minimum guarantee), distribute the rest
  const maxPerType = Math.max(1, Math.floor(count * 0.6)); // cap at 60 % of total
  const base = { multiplication: 1, square: 1, cube: 1 };
  let extras = count - 3;
  const types: QuestionType[] = ['multiplication', 'square', 'cube'];

  while (extras > 0) {
    const t = types[randInt(0, 2)] as keyof typeof base;
    if (base[t] < maxPerType) {
      base[t]++;
      extras--;
    }
  }

  const multCount = base.multiplication;
  const sqCount = base.square;
  const cubeCount = base.cube;

  // Generate multiplication pairs without duplicates
  const usedMult = new Set<string>();
  const multQs: Question[] = [];
  while (multQs.length < multCount) {
    const a = randInt(9, 25);
    const b = randInt(1, 10);
    const key = `${a}x${b}`;
    if (!usedMult.has(key)) {
      usedMult.add(key);
      multQs.push(makeMultiplication(a, b));
    }
  }

  const sqQs = generateSquareQuestions(sqCount);
  const cubeQs = generateCubeQuestions(cubeCount);

  return shuffle([...multQs, ...sqQs, ...cubeQs]);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Allowed question counts: multiples of 5 from 5 to 30. */
export const COUNT_OPTIONS = [5, 10, 15, 20, 25, 30] as const;
export const MIN_QUESTIONS = COUNT_OPTIONS[0];          // 5
export const MAX_QUESTIONS = COUNT_OPTIONS[COUNT_OPTIONS.length - 1]; // 30
export const DEFAULT_QUESTIONS = 10;

/** Generate multiples ×2 through ×9 of a given table number in random order.
 *  ×1 (trivially the number itself) and ×10 (just append a zero) are skipped. */
function generateTableRevisionSession(tableNumber: number): Question[] {
  const questions: Question[] = [];
  for (let b = 2; b <= 9; b++) {
    questions.push(makeMultiplication(tableNumber, b));
  }
  return shuffle(questions);
}

export function generateSession(mode: PracticeMode, count: number, tableNumber?: number): Question[] {
  // Clamp to valid options; snap to nearest multiple-of-5 if needed
  const safe = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, count));
  switch (mode) {
    case 'multiplication':
      return generateMultiplicationSession(safe);
    case 'squares-cubes':
      return generateSquaresCubesSession(safe);
    case 'mixed':
      return generateMixedSession(safe);
    case 'table-revision':
      return generateTableRevisionSession(tableNumber ?? 13);
  }
}

export function computeAnswer(q: Question): number {
  return q.answer;
}

export function checkAnswer(q: Question, userInput: string): { isCorrect: boolean; parsed: number | null } {
  const trimmed = userInput.trim();
  if (trimmed === '') return { isCorrect: false, parsed: null };

  // Only accept valid integers: optional leading minus, then digits (no decimal point, no letters)
  if (!/^-?\d+$/.test(trimmed)) {
    return { isCorrect: false, parsed: null };
  }

  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed)) return { isCorrect: false, parsed: null };

  return { isCorrect: parsed === q.answer, parsed };
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const mins = Math.floor(s / 60);
  const secs = Math.round(s % 60);
  return `${mins}m ${secs}s`;
}

export function computeStats(attempts: import('./types').QuestionAttempt[]): import('./types').SessionStats {
  const total = attempts.length;
  const correct = attempts.filter(a => a.isCorrect).length;
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalTimeMs = attempts.reduce((sum, a) => sum + a.timeTakenMs, 0);
  const averageTimeMs = total > 0 ? Math.round(totalTimeMs / total) : 0;

  return { totalQuestions: total, correct, incorrect, accuracy, totalTimeMs, averageTimeMs, attempts };
}
