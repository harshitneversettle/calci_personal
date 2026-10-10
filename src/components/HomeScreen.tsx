import type { PracticeMode } from '../types';
import { useApp } from '../AppContext';
import { COUNT_OPTIONS } from '../logic';

const MODES: {
  id: PracticeMode;
  title: string;
  desc: string;
  tags: string[];
}[] = [
    {
      id: 'multiplication',
      title: 'Multiplication Tables',
      desc: 'Practice rapid recall of multiplication facts for numbers 9 through 25. Questions are generated fresh each session.',
      tags: ['9 \u00D7 1 to 25 \u00D7 10', 'Integer answers'],
    },
    {
      id: 'squares-cubes',
      title: 'Squares and Cubes',
      desc: 'Sharpen your recall of perfect squares (15\u00B2\u202625\u00B2) and perfect cubes (3\u00B3\u202615\u00B3), mixed evenly each session.',
      tags: ['15\u00B2 to 25\u00B2', '3\u00B3 to 15\u00B3', 'Even split'],
    },
    {
      id: 'mixed',
      title: 'Mixed Practice',
      desc: 'Combines all question types in a single shuffled session. Tests adaptability across multiplication, squares, and cubes.',
      tags: ['All types', 'Random mix'],
    },
  ];

// Multiples of 5: 5, 10, 15, 20, 25, 30

export function HomeScreen() {
  const { state, setQuestionCount, startQuiz } = useApp();
  const { questionCount } = state;

  return (
    <main className="page home-page">
      <div className="container">
        <header className="home-header">
          <h1 className="home-title">Calculation Practice</h1>
          <div className="home-divider" />
          <p className="home-subtitle">
            Speed, accuracy, and recall — built for competitive exam preparation.
          </p>
        </header>

        {/* Question count selector */}
        <div className="count-selector-block">
          <div className="count-selector-label">Questions per session</div>
          <div className="count-selector-row" role="group" aria-label="Number of questions per session">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                id={`count-btn-${n}`}
                className={`count-btn${n === questionCount ? ' active' : ''}`}
                onClick={() => setQuestionCount(n)}
                aria-pressed={n === questionCount}
                aria-label={`${n} questions`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Mode cards */}
        <div className="mode-cards" role="list">
          {MODES.map((mode, i) => (
            <article
              key={mode.id}
              className="mode-card"
              role="listitem"
              onClick={() => startQuiz(mode.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startQuiz(mode.id);
                }
              }}
            >
              <div className="mode-card-badge">
                <span className="mode-card-number">0{i + 1}</span>
                Mode
              </div>
              <h2 className="mode-card-title">{mode.title}</h2>
              <p className="mode-card-desc">{mode.desc}</p>
              <div className="mode-card-tags">
                {mode.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
                {/* Show selected count as a tag */}
                <span className="tag tag-count">{questionCount} questions</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  startQuiz(mode.id);
                }}
                id={`start-${mode.id}`}
                aria-label={`Start ${mode.title} — ${questionCount} questions`}
              >
                Start Practice
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
