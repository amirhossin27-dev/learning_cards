import { Check, ChevronDown, ChevronRight, Dumbbell, Headphones, Layers, ListChecks, Play, Shapes, Target, TextCursorInput, ThumbsUp } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { href, type Route } from '../lib/router';
import { METHODS, type StudyMethod } from '../lib/quiz';
import { actions, getState, useAppData } from '../lib/store';

export const METHOD_ICONS: Record<StudyMethod, typeof Layers> = {
  flip: Layers,
  choice: ListChecks,
  cloze: TextCursorInput,
  listen: Headphones,
  pairs: Shapes,
  truefalse: ThumbsUp,
};

interface Props {
  /** Where the big button leads, or null when there is nothing to learn. */
  route: Extract<Route, { name: 'study' }> | null;
  title: string;
  subtitle: string;
  /** Whether the big button itself is already free practice (then its chip is left out). */
  isPractice?: boolean;
  /** The study route without a mode, for the chips. */
  scope: Extract<Route, { name: 'study' }>;
  /** Number of difficult cards in this scope. */
  hard: number;
  /** Methods that fit these cards and the key the choice is stored under. */
  methods: StudyMethod[];
  methodKey: string;
  /** Extra chips, e.g. CSV import on the start page. */
  children?: ReactNode;
}

/**
 * One big button that starts whatever is due (or new cards, or free practice
 * when everything is done), with quieter chips for the other ways to learn.
 */
export function StudyLauncher({ route, title, subtitle, isPractice, scope, hard, methods, methodKey, children }: Props) {
  return (
    <div className="launcher">
      {route ? (
        <a className="launcher__go" href={href(route)}>
          <Play size={22} fill="currentColor" />
          <span>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </span>
          <ChevronRight size={20} className="launcher__chev" />
        </a>
      ) : (
        <span className="launcher__go is-disabled" aria-disabled="true">
          <Play size={22} />
          <span>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </span>
        </span>
      )}
      {(route || children) && (
        <div className="launcher__chips">
          {route && !isPractice && (
            <a className="launcher__chip" href={href({ ...scope, mode: 'extra' })}>
              <Dumbbell size={15} /> Freies Üben
            </a>
          )}
          {route && hard > 0 && (
            <a className="launcher__chip" href={href({ ...scope, mode: 'hard' })}>
              <Target size={15} /> Schwierige <b>{hard}</b>
            </a>
          )}
          {route && <MethodChip methods={methods} methodKey={methodKey} />}
          {children}
        </div>
      )}
    </div>
  );
}

/** Shows and changes the study method stored for this deck (or for the start page). */
function MethodChip({ methods, methodKey }: { methods: StudyMethod[]; methodKey: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const saved = useAppData().settings.methods?.[methodKey];
  const current: StudyMethod = saved && methods.includes(saved) ? saved : 'flip';
  const Icon = METHOD_ICONS[current];

  useEffect(() => {
    if (!open) return;
    panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (value: StudyMethod) => {
    actions.updateSettings({
      methods: { ...getState().settings.methods, [methodKey]: value },
    });
    setOpen(false);
  };

  return (
    <div className="menu" ref={box}>
      <button type="button" className="launcher__chip" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <Icon size={15} /> Methode: {METHODS.find((m) => m.value === current)?.label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div ref={panel} className="menu__panel menu__panel--left" role="menu">
          <p className="menu__label">So fragt dich die App ab</p>
          {METHODS.filter((m) => methods.includes(m.value)).map(({ value, label }) => {
            const ItemIcon = METHOD_ICONS[value];
            return (
              <button
                key={value}
                role="menuitemradio"
                aria-checked={current === value}
                className={`menu__item ${current === value ? 'is-active' : ''}`}
                onClick={() => choose(value)}
              >
                <ItemIcon size={16} /> {label}
                {current === value && <Check size={16} className="menu__check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
