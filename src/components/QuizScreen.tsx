import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../AppContext';
import { formatTime } from '../logic';
import type { QuestionAttempt } from '../types';

const MODE_LABELS: Record<string, string> = {
  multiplication: 'Multiplication Tables',
  'squares-cubes': 'Squares and Cubes',
  mixed: 'Mixed Practice',
  'table-revision': 'Table Revision',
};

const TYPE_LABELS: Record<string, string> = {
  multiplication: 'Multiplication',
  square: 'Square',
  cube: 'Cube',
};

/** Delay (ms) before auto-advancing after feedback is shown. */
const AUTO_ADVANCE_MS = 1800;

export function QuizScreen() {
  const { state, submitAnswer, nextQuestion, goHome } = useApp();
  const quiz = state.quiz!;

  const { mode, questions, currentIndex, phase, attempts } = quiz;
  const isRevision = mode === 'table-revision';

  const totalQ = questions.length;
  const currentQ = questions[currentIndex];
  const currentAttempt: QuestionAttempt | undefined = attempts[currentIndex];

  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Tracks elapsed ms since feedback appeared, for the drain-bar
  const [feedbackElapsed, setFeedbackElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const feedbackStartRef = useRef<number>(0);

  // ── Reset local state on every new question ────────────────────────────────
  useEffect(() => {
    setInputValue('');
    setInputError('');
    setSubmitted(false);
    setFeedbackElapsed(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentIndex]);

  // ── Auto-advance when feedback phase starts ────────────────────────────────
  useEffect(() => {
    if (phase !== 'feedback' && phase !== 'complete') return;

    // Table revision: if correct → advance immediately; if wrong → wait for user
    if (isRevision) {
      const lastAttempt = attempts[attempts.length - 1];
      if (lastAttempt?.isCorrect) {
        // Instant advance (tiny delay so the green flash is visible)
        const t = setTimeout(() => nextQuestion(), 400);
        return () => clearTimeout(t);
      }
      // Wrong answer — no auto-advance; user presses the Next button
      return;
    }

    feedbackStartRef.current = performance.now();

    // Animate the drain bar via rAF
    function tick() {
      const elapsed = performance.now() - feedbackStartRef.current;
      setFeedbackElapsed(Math.min(elapsed, AUTO_ADVANCE_MS));
      if (elapsed < AUTO_ADVANCE_MS) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    // Schedule the advance
    autoAdvanceTimerRef.current = setTimeout(() => {
      nextQuestion();
    }, AUTO_ADVANCE_MS);

    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, nextQuestion, isRevision, attempts]);

  // ── Submit answer ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (submitted || phase !== 'answering') return;

    const trimmed = inputValue.trim();
    if (trimmed === '') {
      setInputError('Enter a number before submitting.');
      inputRef.current?.focus();
      return;
    }
    if (!/^-?\d+$/.test(trimmed)) {
      setInputError('Only whole numbers are accepted.');
      inputRef.current?.focus();
      return;
    }

    setInputError('');
    setSubmitted(true);
    submitAnswer(trimmed);
  }, [submitted, phase, inputValue, submitAnswer]);

  // ── Skip the delay with Enter while feedback is shown ─────────────────────
  const handleEarlyAdvance = useCallback(() => {
    if (phase !== 'feedback' && phase !== 'complete') return;
    // Cancel the scheduled timer and advance immediately
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    nextQuestion();
  }, [phase, nextQuestion]);

  // ── Keyboard handler for the input ────────────────────────────────────────
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    },
    [handleSubmit]
  );

  // ── Global keyboard: Enter skips feedback wait ─────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (phase === 'feedback' || phase === 'complete')) {
        e.preventDefault();
        handleEarlyAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleEarlyAdvance]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const correct = attempts.filter((a) => a.isCorrect).length;
  const incorrect = attempts.filter((a) => !a.isCorrect).length;
  const answered = attempts.length;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const progressFraction = ((currentIndex + (phase === 'answering' ? 0 : 1)) / totalQ) * 100;
  const isFeedbackPhase = phase === 'feedback' || phase === 'complete';
  // Drain bar: starts full (100 %) and empties to 0 %
  const drainPct = isFeedbackPhase
    ? Math.max(0, 100 - (feedbackElapsed / AUTO_ADVANCE_MS) * 100)
    : 100;

  // Is this a wrong answer in revision mode? (manual advance)
  const isRevisionWrong = isRevision && isFeedbackPhase && currentAttempt && !currentAttempt.isCorrect;

  return (
    <main className="page quiz-page">
      <div className="container">
        {/* Top bar */}
        <div className="quiz-topbar">
          <span className="quiz-mode-label">
            {MODE_LABELS[mode]}
            {isRevision && quiz.tableNumber != null && (
              <span className="quiz-table-badge"> — Table of {quiz.tableNumber}</span>
            )}
          </span>
          <button className="quiz-back-btn" onClick={goHome} aria-label="Return to home screen">
            Home
          </button>
        </div>

        {/* Progress */}
        <div className="quiz-progress-header">
          <div className="quiz-progress-label">
            Question {String(currentIndex + 1).padStart(2, '0')} / {String(totalQ).padStart(2, '0')}
          </div>
          <div
            className="progress-bar-track"
            role="progressbar"
            aria-valuenow={progressFraction}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar-fill" style={{ width: `${progressFraction}%` }} />
          </div>
        </div>

        {/* Live stats */}
        <div className="quiz-stats-row">
          <div className="quiz-stat">
            <span className="quiz-stat-label">Correct</span>
            <span className={`quiz-stat-value${correct > 0 ? ' correct' : ''}`}>{correct}</span>
          </div>
          <div className="quiz-stat">
            <span className="quiz-stat-label">Incorrect</span>
            <span className={`quiz-stat-value${incorrect > 0 ? ' incorrect' : ''}`}>{incorrect}</span>
          </div>
          <div className="quiz-stat">
            <span className="quiz-stat-label">Accuracy</span>
            <span className="quiz-stat-value">{answered > 0 ? `${accuracy}%` : '—'}</span>
          </div>
        </div>

        {/* Question card */}
        <div className="question-card" aria-live="polite" aria-atomic="true">
          <div className="question-type-label">{TYPE_LABELS[currentQ.type]}</div>
          <div className="question-expression" aria-label={`Question: ${currentQ.display} equals`}>
            {currentQ.display}
          </div>
          <div className="question-equals">= ?</div>
        </div>

        {/* Answer input -or- Feedback */}
        {!isFeedbackPhase ? (
          <div className="answer-section">
            <input
              ref={inputRef}
              id="answer-input"
              className={`answer-input${inputError ? ' input-error' : ''}`}
              type="text"
              inputMode="numeric"
              pattern="-?[0-9]*"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError('');
              }}
              onKeyDown={handleInputKeyDown}
              disabled={submitted}
              placeholder="Your answer"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Answer input"
              aria-describedby={inputError ? 'input-error-msg' : undefined}
            />
            {inputError && (
              <div id="input-error-msg" className="input-error-msg" role="alert">
                {inputError}
              </div>
            )}
            <button
              className="btn btn-primary full-width"
              onClick={handleSubmit}
              disabled={submitted}
              id="submit-answer-btn"
              aria-label="Submit answer"
            >
              Submit Answer
            </button>
          </div>
        ) : (
          currentAttempt && (
            <div
              className={`feedback-card ${currentAttempt.isCorrect ? 'correct' : 'incorrect'}${isRevision ? ' revision' : ''}`}
              aria-live="assertive"
              onClick={!isRevisionWrong ? handleEarlyAdvance : undefined}
              style={{ cursor: isRevisionWrong ? 'default' : 'pointer' }}
              title={isRevisionWrong ? undefined : 'Click or press Enter to advance now'}
            >
              {/* Drain bar — only shown in standard mode */}
              {!isRevision && (
                <div className="feedback-drain-track">
                  <div
                    className={`feedback-drain-fill ${currentAttempt.isCorrect ? 'correct' : 'incorrect'}`}
                    style={{ width: `${drainPct}%` }}
                  />
                </div>
              )}

              <div className="feedback-label">
                {currentAttempt.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              {!currentAttempt.isCorrect && (
                <div className="feedback-answer-text">
                  Correct answer: <strong>{currentQ.answer}</strong>
                </div>
              )}
              <div className="feedback-time">{formatTime(currentAttempt.timeTakenMs)}</div>

              {/* In revision mode: manual Next button for wrong answers */}
              {isRevisionWrong ? (
                <button
                  className="btn btn-next-revision full-width"
                  onClick={handleEarlyAdvance}
                  id="revision-next-btn"
                  aria-label={phase === 'complete' ? 'See results' : 'Next question'}
                >
                  {phase === 'complete' ? 'See Results →' : 'Next Question →'}
                </button>
              ) : !isRevision ? (
                <div className="feedback-hint">
                  {phase === 'complete' ? 'Advancing to results…' : 'Advancing to next question…'}
                </div>
              ) : null}
            </div>
          )
        )}
      </div>
    </main>
  );
}
