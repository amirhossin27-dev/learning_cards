import { BOX_LABELS } from '../lib/srs';

interface Props {
  boxes: number[];
  legend?: boolean;
  size?: 'sm' | 'md';
}

/** Leitner boxes as one stacked bar: light = Fach 1, dark = mastered. */
export function BoxBar({ boxes, legend, size = 'sm' }: Props) {
  const total = boxes.reduce((a, b) => a + b, 0);
  const summary = boxes.map((n, i) => `${BOX_LABELS[i]}: ${n}`).join(', ');
  return (
    <div className={`boxbar boxbar--${size}`}>
      <div className="boxbar__track" role="img" aria-label={`Lernstand. ${summary}`}>
        {total === 0 ? (
          <i className="boxbar__empty" />
        ) : (
          boxes.map((n, i) => n > 0 && <i key={i} className={`boxbar__seg b${i}`} style={{ flexGrow: n }} title={`${BOX_LABELS[i]}: ${n}`} />)
        )}
      </div>
      {legend && (
        <ul className="boxbar__legend">
          {boxes.map((n, i) => (
            <li key={i}>
              <i className={`b${i}`} />
              <span>{BOX_LABELS[i]}</span>
              <strong>{n}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
