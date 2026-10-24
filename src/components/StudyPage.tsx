import { ArrowLeftRight, Check, Ellipsis, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { useToday } from '../hooks/useToday';
import { href, navigate, type StudyMode } from '../lib/router';
import { resolveLang, useSpeech } from '../lib/speech';
import { BOX_LABELS, formatWait, isNew, previewWaits, RATINGS, repeatsInSession, schedule, type Rating } from '../lib/srs';
import { actions, buildPractice, buildSession, getState, newCardsLeft, planToday, useAppData } from '../lib/store';
import type { Card, Direction } from '../types';
import { FlipCard } from './FlipCard';
import { ProgressRing } from './ProgressRing';

interface Props {
  /** Undefined = today's round across all decks. */
  deckId?: string;
  tag?: string;
  /** Undefined = today's list. See `StudyMode`. */
  mode?: StudyMode;
}

interface QueueItem {
  card: Card;
  /** Whether the card's back side is shown as the question. */
  reversed: boolean;
  key: number;
}

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'front', label: 'Vorderseite zuerst' },
  { value: 'back', label: 'Rückseite zuerst' },
  { value: 'mixed', label: 'Gemischt' },
];

let nextKey = 1;
const pickReversed = (direction: Direction) => direction === 'back' || (direction === 'mixed' && Math.random() < 0.5);

function buildQueue(deckId: string | undefined, tag: string | undefined, mode: StudyMode | undefined, direction: Direction): QueueItem[] {
  const s = getState();
  const scoped = s.cards.filter((c) => (!deckId || c.deckId === deckId) && (!tag || c.tag === tag));
  const order = s.decks.map((d) => d.id);
  const { sessionSize, newPerDay } = s.settings;
  let list: Card[];
  if (mode === 'extra') list = buildPractice(scoped, sessionSize);
  // One more batch of new cards, as many as a day's budget.
  else if (mode === 'new') list = planToday(scoped, sessionSize > 0 ? Math.min(sessionSize, newPerDay) : newPerDay, order).fresh;
  else list = buildSession(planToday(scoped, newCardsLeft(s), order), sessionSize);
  return list.map((card) => ({ card, reversed: pickReversed(direction), key: nextKey++ }));
}

/** "3 Tage" → "in 3 Tagen", "< 1 Min." → "gleich". */
function inWait(ms: number) {
  const text = formatWait(ms);
  return text.startsWith('<') ? 'gleich' : `in ${text.replace(/Tage$/, 'Tagen')}`;
}

export function StudyPage({ deckId, tag, mode }: Props) {
  const { decks, cards, settings } = useAppData();
  const { reviews, goal } = useToday();
  const extra = mode === 'extra';
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined;
  const scoped = useMemo(() => cards.filter((c) => (!deckId || c.deckId === deckId) && (!tag || c.tag === tag)), [cards, deckId, tag]);
  const scopeSize = scoped.length;
  const scopeNew = useMemo(() => scoped.filter(isNew).length, [scoped]);
  const { speak, stop, speakingKey, supported } = useSpeech(settings.speechRate);

  const [direction, setDirection] = useState<Direction>(settings.direction);
  const [queue, setQueue] = useState<QueueItem[]>(() => buildQueue(deckId, tag, mode, settings.direction));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const [tally, setTally] = useState({ answers: 0, again: 0 });
  const [feedback, setFeedback] = useState<{ text: string; id: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const studied = useRef(new Set<string>());
  const menu = useRef<HTMLDivElement>(null);

  const current = queue[index];
  const done = index >= queue.length;
  const live = current ? (cards.find((c) => c.id === current.card.id) ?? current.card) : undefined;
  const cardDeck = live ? decks.find((d) => d.id === live.deckId) : undefined;
  const exitHref = deckId ? href({ name: 'deck', id: deckId }) : href({ name: 'home' });

  const restart = useCallback(() => {
    stop();
    studied.current = new Set();
    setQueue(buildQueue(deckId, tag, mode, direction));
    setIndex(0);
    setFlipped(false);
    setTally({ answers: 0, again: 0 });
  }, [deckId, tag, mode, direction, stop]);

  const changeDirection = (value: Direction) => {
    setDirection(value);
    actions.updateSettings({ direction: value });
    setQueue((q) => q.map((item, i) => (i < index ? item : { ...item, reversed: pickReversed(value) })));
    setFlipped(false);
    setMenuOpen(false);
  };

  const faces = useMemo(() => {
    if (!current || !live || !cardDeck) return null;
    const front = { text: live.front, lang: resolveLang(cardDeck.frontLang, settings) };
    const back = { text: live.back, lang: resolveLang(cardDeck.backLang, settings) };
    return {
      question: current.reversed ? back : front,
      answer: current.reversed ? front : back,
      example: live.example ? { text: live.example, lang: front.lang } : undefined,
    };
  }, [current, live, cardDeck, settings]);

  // Labels under the answer buttons are computed when the card is turned, so they match the moment of answering.
  const waits = useMemo(() => (flipped && live && !extra ? previewWaits(live, Date.now()) : null), [flipped, live, extra]);

  // Auto-speak the question whenever a new card appears.
  useEffect(() => {
    if (settings.autoSpeak && faces && !flipped) speak(faces.question.text, faces.question.lang, 'q');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1700);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const rate = useCallback(
    (rating: Rating) => {
      if (!current || leaving) return;
      stop();
      const now = Date.now();
      const latest = getState().cards.find((c) => c.id === current.card.id) ?? current.card;
      actions.reviewCard(latest.id, rating, extra);
      studied.current.add(latest.id);

      const repeat = extra ? rating === 1 : repeatsInSession(latest, rating);
      if (repeat) setQueue((q) => [...q, { ...current, key: nextKey++ }]);
      setTally((t) => ({ answers: t.answers + 1, again: t.again + (rating === 1 ? 1 : 0) }));

      let text: string | null = null;
      if (repeat) text = rating === 1 ? 'Kommt gleich nochmal' : 'Kommt in dieser Runde wieder';
      else if (!extra) {
        const next = schedule(latest, rating, now);
        const moved = next.box !== latest.box ? `${BOX_LABELS[latest.box]} → ${BOX_LABELS[next.box]}` : BOX_LABELS[next.box];
        text = `${moved} · wieder ${inWait(next.due - now)}`;
      }
      if (text) setFeedback({ text, id: now });

      setLeaving(rating >= 3 ? 'right' : 'left');
      window.setTimeout(() => {
        setLeaving(null);
        setFlipped(false);
        setIndex((i) => i + 1);
      }, 280);
    },
    [current, leaving, stop, extra],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        else navigate(deckId ? { name: 'deck', id: deckId } : { name: 'home' });
        return;
      }
      if (done || !faces) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === 'ArrowRight' || e.key === '3')) rate(3);
      else if (flipped && (e.key === 'ArrowLeft' || e.key === '1')) rate(1);
      else if (flipped && !extra && e.key === '2') rate(2);
      else if (flipped && !extra && e.key === '4') rate(4);
      else if (e.key === 's' && supported) {
        const face = flipped ? faces.answer : faces.question;
        speak(face.text, face.lang, flipped ? 'a' : 'q');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deckId, done, faces, flipped, rate, speak, supported, extra, menuOpen]);

  if (deckId && !deck) {
    return (
      <div className="empty empty--page">
        <p>Diesen Stapel gibt es nicht mehr.</p>
        <a className="btn btn--primary" href={href({ name: 'home' })}>
          Zur Übersicht
        </a>
      </div>
    );
  }

  if (scopeSize === 0) {
    return (
      <div className="empty empty--page">
        <p>{deck ? 'In diesem Stapel sind noch keine Karten.' : 'Du hast noch keine Karten.'}</p>
        <a className="btn btn--primary" href={deck ? href({ name: 'deck', id: deck.id }) : href({ name: 'decks' })}>
          Karten hinzufügen
        </a>
      </div>
    );
  }

  if (queue.length === 0) {
    const offerNew = mode !== 'new' && scopeNew > 0;
    return (
      <div className="empty empty--page">
        <div className="empty__icon">
          <Check size={28} />
        </div>
        <h2>{mode === 'new' ? 'Hier gibt es keine neuen Karten mehr' : 'Für heute ist hier nichts mehr fällig'}</h2>
        <p>
          {offerNew
            ? `Du kannst mit ${scopeNew === 1 ? 'der letzten neuen Karte' : `${scopeNew} neuen Karten`} weitermachen oder in einer Extra-Runde üben, die keine Termine verschiebt.`
            : 'Mit einer Extra-Runde kannst du trotzdem üben. Sie zählt für dein Tagesziel, verschiebt aber keine Termine.'}
        </p>
        <div className="empty__actions">
          {offerNew && (
            <a className="btn btn--primary" href={href({ name: 'study', id: deckId, tag, mode: 'new' })}>
              <Plus size={18} /> Neue Karten lernen
            </a>
          )}
          <a className={`btn ${offerNew ? 'btn--secondary' : 'btn--primary'}`} href={href({ name: 'study', id: deckId, tag, mode: 'extra' })}>
            <Sparkles size={18} /> Extra-Runde starten
          </a>
          <a className="btn btn--ghost" href={exitHref}>
            Zurück
          </a>
        </div>
      </div>
    );
  }

  const progress = queue.length ? index / queue.length : 0;
  const remaining = queue.length - index;
  const title = deck ? deck.name : 'Heute';

  return (
    <div className="study">
      <header className="study__bar">
        <a className="icon-btn icon-btn--tint" href={exitHref} aria-label="Lernen beenden">
          <X size={19} />
        </a>
        <div
          className="study__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={index}
          aria-label="Fortschritt der Runde"
        >
          <i style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="study__count">
          {Math.min(index + 1, queue.length)} / {queue.length}
        </span>
        <div className="menu" ref={menu}>
          <button className="icon-btn icon-btn--tint" onClick={() => setMenuOpen((o) => !o)} aria-label="Lernoptionen" aria-expanded={menuOpen}>
            <Ellipsis size={19} />
          </button>
          {menuOpen && (
            <div className="menu__panel" role="menu">
              <p className="menu__label">
                <ArrowLeftRight size={14} /> Abfragerichtung
              </p>
              {DIRECTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  role="menuitemradio"
                  aria-checked={direction === value}
                  className={`menu__item ${direction === value ? 'is-active' : ''}`}
                  onClick={() => changeDirection(value)}
                >
                  {label}
                  {direction === value && <Check size={16} className="menu__check" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {!done && faces && current && live && cardDeck ? (
        <>
          <p className="study__deck" data-marker={cardDeck.color % 6}>
            <i className="marker-tab" aria-hidden="true" />
            <span>{deck ? title : cardDeck.name}</span>
            {tag && <span className="muted">· {tag}</span>}
            {mode && <span className="chip chip--sm">{extra ? 'Extra-Runde' : 'Neue Karten'}</span>}
          </p>

          <div className={`study__stage ${remaining > 1 ? 'has-stack' : ''} ${remaining > 2 ? 'has-stack-2' : ''}`}>
            <div className="stack-ghost g2" aria-hidden="true" />
            <div className="stack-ghost g1" aria-hidden="true" />
            <div className={`study__card ${leaving ? `leaving-${leaving}` : ''}`} key={current.key}>
              <FlipCard
                question={faces.question}
                answer={faces.answer}
                example={faces.example}
                note={live.note}
                tag={live.tag}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
                onSwipe={(known) => rate(known ? 3 : 1)}
                knownLabel={extra ? 'Gewusst' : 'Gut'}
                speak={speak}
                speakingKey={speakingKey}
                speechSupported={supported}
              />
            </div>
          </div>

          <div className="study__actions">
            {feedback && (
              <p className="study__feedback" key={feedback.id} role="status">
                {feedback.text}
              </p>
            )}
            {!flipped ? (
              <button className="btn btn--primary btn--xl" onClick={() => setFlipped(true)}>
                Antwort zeigen
              </button>
            ) : extra ? (
              <div className="rate rate--2">
                <button className="rate__btn r1" onClick={() => rate(1)}>
                  Nochmal
                </button>
                <button className="rate__btn r3" onClick={() => rate(3)}>
                  Gewusst
                </button>
              </div>
            ) : (
              <div className="rate">
                {RATINGS.map(({ value, label }) => (
                  <button key={value} className={`rate__btn r${value}`} onClick={() => rate(value)}>
                    {label}
                    <small>{waits?.[value]}</small>
                  </button>
                ))}
              </div>
            )}
            <p className="study__hint">
              <span className="only-touch">{flipped ? 'Wischen: links nochmal, rechts gewusst' : 'Tippe auf die Karte, um sie umzudrehen'}</span>
              <span className="only-pointer">
                <kbd>Leertaste</kbd> umdrehen · {extra ? <><kbd>←</kbd> nochmal · <kbd>→</kbd> gewusst</> : <><kbd>1</kbd>–<kbd>4</kbd> bewerten</>} ·{' '}
                <kbd>S</kbd> vorlesen
              </span>
            </p>
          </div>
        </>
      ) : (
        <SessionDone
          cards={studied.current.size}
          answers={tally.answers}
          again={tally.again}
          reviews={reviews}
          goal={goal}
          onRestart={restart}
          exitHref={exitHref}
          mode={mode}
        />
      )}
    </div>
  );
}

interface DoneProps {
  cards: number;
  answers: number;
  again: number;
  reviews: number;
  goal: number;
  onRestart: () => void;
  exitHref: string;
  mode?: StudyMode;
}

function SessionDone({ cards, answers, again, reviews, goal, onRestart, exitHref, mode }: DoneProps) {
  const shown = useCountUp(cards);
  const known = Math.max(0, answers - again);
  const reached = reviews >= goal;
  return (
    <div className="study__done">
      <h2>
        Runde <mark className="mark-draw">geschafft</mark>
      </h2>
      <p className="study__done-big">
        <strong>{shown}</strong> {cards === 1 ? 'Karte' : 'Karten'} gelernt
      </p>
      <div className="study__done-stats">
        <span>
          <Check size={16} /> {known} gewusst
        </span>
        <span>
          <RotateCcw size={16} /> {again}× nochmal
        </span>
      </div>
      <div className="goal goal--inline">
        <ProgressRing value={reviews / Math.max(1, goal)} size={52} stroke={6} label={String(reviews)} />
        <div>
          <strong>{reached ? 'Tagesziel erreicht' : `Tagesziel: ${reviews} von ${goal}`}</strong>
          <span>{reached ? 'Stark. Morgen geht es weiter.' : `Noch ${goal - reviews} bis zum Ziel.`}</span>
        </div>
      </div>
      <div className="study__done-actions">
        <button className="btn btn--primary btn--lg" onClick={onRestart}>
          {mode === 'extra' ? <Sparkles size={18} /> : mode === 'new' ? <Plus size={18} /> : <RotateCcw size={18} />}{' '}
          {mode === 'new' ? 'Weitere neue Karten' : 'Noch eine Runde'}
        </button>
        <a className="btn btn--ghost btn--lg" href={exitHref}>
          Fertig
        </a>
      </div>
    </div>
  );
}
