// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayRecord {
  date: string;       // YYYY-MM-DD
  correct: number;    // total correct answers that day
  total: number;      // total questions answered that day
  sessions: number;   // number of sessions completed
}

export interface AppSettings {
  questionCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

// ─── History ──────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'calci_history';

export function loadHistory(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DayRecord>) : {};
  } catch {
    return {};
  }
}

export function recordSession(correct: number, total: number): void {
  if (total <= 0) return;
  const history = loadHistory();
  const today = todayStr();
  const prev = history[today] ?? { date: today, correct: 0, total: 0, sessions: 0 };
  history[today] = {
    date: today,
    correct: prev.correct + correct,
    total: prev.total + total,
    sessions: prev.sessions + 1,
  };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

// ─── Streak ───────────────────────────────────────────────────────────────────

/** Returns the number of consecutive days (ending today) where correct > 0. */
export function computeStreak(history: Record<string, DayRecord>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 730; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateStr(d);
    if (history[key] && history[key].correct > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'calci_settings';
export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 3;
export const MAX_QUESTION_COUNT = 200;

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const count = Number(parsed.questionCount);
      if (Number.isFinite(count) && count >= MIN_QUESTION_COUNT) {
        return { questionCount: Math.min(count, MAX_QUESTION_COUNT) };
      }
    }
  } catch {
    // ignore
  }
  return { questionCount: DEFAULT_QUESTION_COUNT };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
