import { useApp } from '../AppContext';

const TABLE_NUMBERS = Array.from({ length: 13 }, (_, i) => i + 13); // 13..25

export function TableSelectScreen() {
  const { startTableRevision, goHome } = useApp();

  return (
    <main className="page table-select-page">
      <div className="container">
        <header className="table-select-header">
          <div className="table-select-eyebrow">Table Revision</div>
          <h1 className="table-select-title">Which table?</h1>
          <p className="table-select-sub">
            Pick a number. You'll be quizzed on multiples ×2 through ×9 (8 questions) in random order.
          </p>
        </header>

        <div className="table-grid" role="list" aria-label="Choose a multiplication table">
          {TABLE_NUMBERS.map((n) => (
            <button
              key={n}
              id={`table-btn-${n}`}
              className="table-grid-btn"
              role="listitem"
              onClick={() => startTableRevision(n)}
              aria-label={`Revise table of ${n}`}
            >
              <span className="table-grid-num">{n}</span>
              <span className="table-grid-hint">× 1–10</span>
            </button>
          ))}
        </div>

        <div className="table-select-footer">
          <button className="btn btn-ghost full-width" onClick={goHome} id="table-select-back">
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
