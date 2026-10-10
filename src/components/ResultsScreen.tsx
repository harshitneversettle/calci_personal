import { useApp } from '../AppContext';
import { computeStats, formatTime } from '../logic';

const MODE_LABELS: Record<string, string> = {
  multiplication: 'Multiplication Tables',
  'squares-cubes': 'Squares and Cubes',
  mixed: 'Mixed Practice',
};

export function ResultsScreen() {
  const { state, goHome, restartQuiz } = useApp();
  const quiz = state.quiz!;
  const stats = computeStats(quiz.attempts);

  const {
    totalQuestions,
    correct,
    incorrect,
    accuracy,
    totalTimeMs,
    averageTimeMs,
    attempts,
  } = stats;

  return (
    <main className="page results-page">
      <div className="container">
        {/* Header */}
        <header className="results-header">
          <div className="results-mode">{MODE_LABELS[quiz.mode]} — Session Complete</div>
          <div className="results-score-block">
            <span className="results-score-main">{correct}</span>
            <span className="results-score-denom"> / {totalQuestions}</span>
          </div>
          <div className="results-accuracy">{accuracy}% accuracy</div>
        </header>

        {/* Stats grid */}
        <div className="results-stats-grid">
          <div className="results-stat-card">
            <div className="results-stat-label">Correct</div>
            <div className="results-stat-value correct">{correct}</div>
          </div>
          <div className="results-stat-card">
            <div className="results-stat-label">Incorrect</div>
            <div className="results-stat-value incorrect">{incorrect}</div>
          </div>
          <div className="results-stat-card">
            <div className="results-stat-label">Total Time</div>
            <div className="results-stat-value">{formatTime(totalTimeMs)}</div>
          </div>
          <div className="results-stat-card">
            <div className="results-stat-label">Avg / Question</div>
            <div className="results-stat-value">{formatTime(averageTimeMs)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions">
          <button
            className="btn btn-primary full-width"
            onClick={restartQuiz}
            id="restart-quiz-btn"
            aria-label="Start a new session in the same mode"
          >
            New Session
          </button>
          <button
            className="btn btn-ghost full-width"
            onClick={goHome}
            id="go-home-btn"
            aria-label="Return to home screen"
          >
            Home
          </button>
        </div>

        <div className="divider" />

        {/* Review table */}
        <div className="review-section-label">Answer Review</div>
        <div className="review-table-wrapper">
          <table className="review-table" aria-label="Answer review">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Question</th>
                <th scope="col">Your Answer</th>
                <th scope="col">Correct Answer</th>
                <th scope="col">Result</th>
                <th scope="col">Time</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, i) => (
                <tr key={attempt.question.id}>
                  <td>{i + 1}</td>
                  <td className="cell-question">
                    {attempt.question.display} = ?
                  </td>
                  <td>
                    {attempt.userAnswer === null ? (
                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                    ) : attempt.isCorrect ? (
                      <span className="cell-answer-right">{attempt.userAnswer}</span>
                    ) : (
                      <span className="cell-answer-wrong">{attempt.userAnswer}</span>
                    )}
                  </td>
                  <td className="cell-answer-right">{attempt.question.answer}</td>
                  <td>
                    {attempt.isCorrect ? (
                      <span className="cell-result-correct">Correct</span>
                    ) : (
                      <span className="cell-result-incorrect">Incorrect</span>
                    )}
                  </td>
                  <td className="cell-time">{formatTime(attempt.timeTakenMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
