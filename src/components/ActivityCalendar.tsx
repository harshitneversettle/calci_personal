import React, { useMemo, useState, useRef, useEffect } from 'react';
import { loadHistory, computeStreak, toDateStr, type DayRecord } from '../storage';

// ─── Color scale (neutral grays — fits B&W theme) ────────────────────────────

function cellColor(correct: number, isFuture: boolean): string {
  if (isFuture) return 'transparent';
  if (correct === 0) return '#1c1c1c';
  if (correct <= 3)  return '#3a3a3a';
  if (correct <= 8)  return '#626262';
  if (correct <= 19) return '#9a9a9a';
  return '#e0e0e0';
}

// ─── Calendar Data Builder ────────────────────────────────────────────────────

interface CalCell {
  dateStr: string;
  record: DayRecord | null;
  isFuture: boolean;
  isToday: boolean;
}

function buildGrid(history: Record<string, DayRecord>): {
  weeks: CalCell[][];
  monthLabels: { label: string; weekIndex: number }[];
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  // Start from Sunday 52 weeks ago (364 days back), aligned to week start
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const dayOfWeek = start.getDay(); // 0=Sun
  start.setDate(start.getDate() - dayOfWeek);

  const weeks: CalCell[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const cursor = new Date(start);
  let lastMonth = -1;

  while (cursor <= today) {
    const week: CalCell[] = [];
    const weekIndex = weeks.length;

    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(cursor);
      const isFuture = cursor > today;
      const isToday = dateStr === todayStr;
      const m = cursor.getMonth();

      if (d === 0 && m !== lastMonth && !isFuture) {
        monthLabels.push({ label: MONTH_ABBR[m], weekIndex });
        lastMonth = m;
      }

      week.push({ dateStr, record: history[dateStr] ?? null, isFuture, isToday });
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return { weeks, monthLabels };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityCalendar() {
  const [history, setHistory] = useState<Record<string, DayRecord>>({});
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const { weeks, monthLabels } = useMemo(() => buildGrid(history), [history]);
  const streak = useMemo(() => computeStreak(history), [history]);

  // Count total days practiced
  const totalDays = Object.values(history).filter(r => r.correct > 0).length;

  const handleMouseEnter = (cell: CalCell, e: React.MouseEvent) => {
    if (cell.isFuture || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const target = e.currentTarget as HTMLElement;
    const cellRect = target.getBoundingClientRect();

    const dateLabel = new Date(cell.dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

    const correct = cell.record?.correct ?? 0;
    const total = cell.record?.total ?? 0;
    const text = correct > 0
      ? `${dateLabel} — ${correct}/${total} correct`
      : `${dateLabel} — No practice`;

    setTooltip({
      text,
      x: cellRect.left - rect.left + cellRect.width / 2,
      y: cellRect.top - rect.top - 8,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  const CELL = 12; // px
  const GAP = 2;   // px

  return (
    <div className="cal-block">
      {/* Header row */}
      <div className="cal-header-row">
        <div className="cal-title">Practice Activity</div>
        <div className="cal-meta">
          <span className="cal-streak">
            {streak > 0 ? `${streak} day streak` : 'No streak yet'}
          </span>
          <span className="cal-sep">·</span>
          <span className="cal-days">{totalDays} day{totalDays !== 1 ? 's' : ''} practiced</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="cal-wrapper" ref={containerRef}>
        {/* Month labels row */}
        <div
          className="cal-month-row"
          style={{ width: weeks.length * (CELL + GAP) }}
        >
          {monthLabels.map(({ label, weekIndex }) => (
            <span
              key={`${label}-${weekIndex}`}
              className="cal-month-label"
              style={{ left: weekIndex * (CELL + GAP) }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Week columns */}
        <div className="cal-grid" style={{ gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="cal-week" style={{ gap: GAP }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={`cal-cell${cell.isToday ? ' today' : ''}`}
                  style={{
                    width: CELL,
                    height: CELL,
                    background: cellColor(cell.record?.correct ?? 0, cell.isFuture),
                  }}
                  onMouseEnter={(e) => handleMouseEnter(cell, e)}
                  onMouseLeave={handleMouseLeave}
                  aria-label={
                    cell.record
                      ? `${cell.dateStr}: ${cell.record.correct} correct`
                      : cell.dateStr
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="cal-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}

        {/* Legend */}
        <div className="cal-legend">
          <span className="cal-legend-label">Less</span>
          {['#1c1c1c', '#3a3a3a', '#626262', '#9a9a9a', '#e0e0e0'].map((c) => (
            <div key={c} className="cal-cell" style={{ width: CELL, height: CELL, background: c }} />
          ))}
          <span className="cal-legend-label">More</span>
        </div>
      </div>
    </div>
  );
}
