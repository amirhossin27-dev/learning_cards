import { STAGES, type Stage } from '../lib/srs';
import type { DeckStats } from '../lib/store';

interface Props {
  stats: Pick<DeckStats, 'total' | 'fresh' | 'learning' | 'solid'>;
  /** The three stages spelled out below the bar, with what they mean. */
  legend?: boolean;
  size?: 'sm' | 'md';
}

const count = (stats: Props['stats'], stage: Stage) => (stage === 'solid' ? stats.solid : stage === 'learning' ? stats.learning : stats.fresh);

/**
 * Learning progress as a bar that fills from the left: dark = sitzt,
 * highlighter = am Lernen, the empty rest = neu.
 */
export function StageBar({ stats, legend, size = 'sm' }: Props) {
  const summary = STAGES.map((s) => `${s.label}: ${count(stats, s.value)}`).join(', ');
  return (
    <div className={`stagebar stagebar--${size}`}>
      <div className="stagebar__track" role="img" aria-label={`Lernstand. ${summary}`}>
        {STAGES.map(({ value, label }) => {
          const n = count(stats, value);
          return n > 0 && <i key={value} className={`stagebar__seg is-${value}`} style={{ flexGrow: n }} title={`${label}: ${n}`} />;
        })}
      </div>
      {legend && (
        <ul className="stagebar__legend">
          {STAGES.map(({ value, label, hint }) => (
            <li key={value}>
              <i className={`is-${value}`} />
              <span>
                <b>{label}</b>
                <small>{hint}</small>
              </span>
              <strong>{count(stats, value)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "62 von 193 Karten sitzen schon", the headline over a deck's bar. */
export function solidText(stats: Pick<DeckStats, 'total' | 'solid'>): string {
  if (stats.total === 0) return 'Noch keine Karten';
  if (stats.solid === 0) return 'Noch sitzt keine Karte';
  return `${stats.solid} von ${stats.total} ${stats.solid === 1 ? 'sitzt' : 'sitzen'} schon`;
}
