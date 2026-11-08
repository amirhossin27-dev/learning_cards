import { Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { shuffled } from '../lib/questions';

export interface Pair {
  /** Card id. */
  id: string;
  question: string;
  answer: string;
}

interface Props {
  pairs: Pair[];
  leaving: boolean;
  /** Called with the number of wrong attempts per card id once every pair is found and "Weiter" is tapped. */
  onDone: (mistakes: Record<string, number>) => void;
}

type Side = 'q' | 'a';

/** Match questions with answers: tap one on the left and one on the right. */
export function PairsBoard({ pairs, leaving, onDone }: Props) {
  // Both columns are shuffled once, so they don't jump around while playing.
  const left = useMemo(() => shuffled(pairs, Math.random), [pairs]);
  const right = useMemo(() => shuffled(pairs, Math.random), [pairs]);
  const [selected, setSelected] = useState<{ side: Side; id: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [wrong, setWrong] = useState<{ q: string; a: string } | null>(null);
  const mistakes = useRef<Record<string, number>>({});
  const next = useRef<HTMLButtonElement>(null);
  const done = matched.size === pairs.length;

  useEffect(() => {
    if (!wrong) return;
    const timer = window.setTimeout(() => setWrong(null), 650);
    return () => window.clearTimeout(timer);
  }, [wrong]);

  useEffect(() => {
    if (done) next.current?.focus({ preventScroll: true });
  }, [done]);

  const tap = (side: Side, id: string) => {
    if (matched.has(id) || done) return;
    if (!selected || selected.side === side) {
      setSelected(selected?.side === side && selected.id === id ? null : { side, id });
      return;
    }
    const q = side === 'q' ? id : selected.id;
    const a = side === 'a' ? id : selected.id;
    setSelected(null);
    if (q === a) {
      setMatched((m) => new Set(m).add(q));
    } else {
      // A wrong match counts against both cards involved.
      mistakes.current[q] = (mistakes.current[q] ?? 0) + 1;
      mistakes.current[a] = (mistakes.current[a] ?? 0) + 1;
      setWrong({ q, a });
    }
  };

  const tile = (side: Side, p: Pair) => {
    const isMatched = matched.has(p.id);
    const isSelected = selected?.side === side && selected.id === p.id;
    const isWrong = wrong?.[side] === p.id;
    return (
      <button
        key={p.id}
        type="button"
        className={`pair-tile pair-tile--${side} ${isMatched ? 'is-matched' : ''} ${isSelected ? 'is-selected' : ''} ${isWrong ? 'is-wrong' : ''}`}
        onClick={() => tap(side, p.id)}
        disabled={isMatched}
        aria-pressed={isSelected}
      >
        <span>{side === 'q' ? p.question : p.answer}</span>
      </button>
    );
  };

  const firstTry = pairs.filter((p) => !mistakes.current[p.id]).length;

  return (
    <div className={`quiz pairs ${leaving ? 'is-leaving' : ''}`}>
      <p className="pairs__title">
        {done ? (
          <>
            <Check size={18} /> Alle Paare gefunden · {firstTry} von {pairs.length} auf Anhieb
          </>
        ) : (
          'Tippe ein Paar an: links die Frage, rechts die Antwort'
        )}
      </p>
      <div className="pairs__grid">
        <div className="pairs__col">{left.map((p) => tile('q', p))}</div>
        <div className="pairs__col">{right.map((p) => tile('a', p))}</div>
      </div>
      {done && (
        <div className="quiz-result">
          <button ref={next} type="button" className="btn btn--primary btn--xl" onClick={() => onDone({ ...mistakes.current })}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
