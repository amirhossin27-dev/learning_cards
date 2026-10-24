import { addDays, dayKey, startOfDay } from '../lib/srs';
import type { DayLog } from '../types';

interface Props {
  history: Record<string, DayLog>;
  goal: number;
  weeks: number;
  now: number;
}

const DATE = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });

function level(reviews: number, goal: number): number {
  if (reviews <= 0) return 0;
  const share = reviews / Math.max(1, goal);
  if (share < 0.25) return 1;
  if (share < 0.5) return 2;
  if (share < 1) return 3;
  return 4;
}

/** Study calendar: one column per week (Monday on top), shade = share of the daily goal. */
export function Heatmap({ history, goal, weeks, now }: Props) {
  const today = startOfDay(now);
  const weekday = (new Date(today).getDay() + 6) % 7; // Monday = 0
  const first = addDays(today, -weekday - (weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const day = addDays(first, i);
    if (day > today) {
      cells.push(<i key={i} className="heat__cell is-future" />);
      continue;
    }
    const reviews = history[dayKey(day)]?.reviews ?? 0;
    cells.push(
      <i
        key={i}
        className={`heat__cell l${level(reviews, goal)} ${day === today ? 'is-today' : ''}`}
        title={`${DATE.format(day)}: ${reviews} ${reviews === 1 ? 'Karte' : 'Karten'}`}
      />,
    );
  }
  const active = Object.values(history).filter((d) => d.reviews > 0).length;
  return (
    <div className="heat">
      <div
        className="heat__grid"
        style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
        role="img"
        aria-label={`Lernkalender der letzten ${weeks} Wochen, an ${active} Tagen gelernt`}
      >
        {cells}
      </div>
      <div className="heat__legend" aria-hidden="true">
        <span>weniger</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={`heat__cell l${l}`} />
        ))}
        <span>Tagesziel</span>
      </div>
    </div>
  );
}
