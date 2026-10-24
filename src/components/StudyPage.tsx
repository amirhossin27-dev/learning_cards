import { ArrowLeft, ArrowLeftRight, Check, PartyPopper, RotateCcw, Shuffle, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveLang, useSpeech } from '../lib/speech';
import { actions, buildSession, useAppData } from '../lib/store';
import { href, navigate } from '../lib/router';
import type { Card, Direction } from '../types';
import { FlipCard } from './FlipCard';
import { ProgressRing } from './ProgressRing';

interface Props {
  deckId: string;
  tag?: string;
}

interface QueueItem {
  card: Card;
  /** Whether the card's back side is shown as the question. */
  reversed: boolean;
}

const DIRECTIONS: { value: Direction; label: string; icon: typeof ArrowLeftRight }[] = [
  { value: 'front', label: 'Vorderseite zuerst', icon: ArrowLeftRight },
  { value: 'back', label: 'Rückseite zuerst', icon: Undo2 },
  { value: 'mixed', label: 'Gemischt', icon: Shuffle },
];

function makeQueue(cards: Card[], direction: Direction, size: number): QueueItem[] {
  return buildSession(cards, size).map((card) => ({
    card,
    reversed: direction === 'back' || (direction === 'mixed' && Math.random() < 0.5),
  }));
}

export function StudyPage({ deckId, tag }: Props) {
  const { decks, cards, settings } = useAppData();
  const deck = decks.find((d) => d.id === deckId);
  const deckCards = useMemo(() => cards.filter((c) => c.deckId === deckId && (!tag || c.tag === tag)), [cards, deckId, tag]);
  const { speak, stop, speakingKey, supported } = useSpeech(settings.speechRate);

  const [direction, setDirection] = useState<Direction>(settings.direction);
  const [queue, setQueue] = useState<QueueItem[]>(() => makeQueue(deckCards, settings.direction, settings.sessionSize));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [leaving, setLeaving] = useState<'known' | 'again' | null>(null);
  const [result, setResult] = useState({ known: 0, again: 0 });
  const missed = useRef(new Set<string>());

  const current = queue[index];
  const done = index >= queue.length;
  const sessionUnique = useMemo(() => new Set(queue.map((q) => q.card.id)).size, [queue]);

  const restart = useCallback(
    (dir: Direction = direction) => {
      stop();
      missed.current = new Set();
      setQueue(makeQueue(deckCards, dir, settings.sessionSize));
      setIndex(0);
      setFlipped(false);
      setResult({ known: 0, again: 0 });
    },
    [deckCards, direction, settings.sessionSize, stop],
  );

  const faces = useMemo(() => {
    if (!current || !deck) return null;
    const { card, reversed } = current;
    const front = { text: card.front, lang: resolveLang(deck.frontLang, settings) };
    const back = { text: card.back, lang: resolveLang(deck.backLang, settings) };
    return {
      question: reversed ? back : front,
      answer: reversed ? front : back,
      example: card.example ? { text: card.example, lang: front.lang } : undefined,
    };
  }, [current, deck, settings]);

  // Auto-speak the question whenever a new card appears.
  useEffect(() => {
    if (settings.autoSpeak && faces && !flipped) speak(faces.question.text, faces.question.lang, 'q');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue]);

  const rate = useCallback(
    (known: boolean) => {
      if (!current || leaving) return;
      stop();
      const { card } = current;
      // Only the first answer in a session moves the card between Leitner boxes.
      if (!missed.current.has(card.id)) actions.reviewCard(card.id, known);
      if (!known) {
        missed.current.add(card.id);
        setQueue((q) => [...q, { ...current }]);
      }
      setResult((r) => ({ known: r.known + (known ? 1 : 0), again: r.again + (known ? 0 : 1) }));
      setLeaving(known ? 'known' : 'again');
      window.setTimeout(() => {
        setLeaving(null);
        setFlipped(false);
        setIndex((i) => i + 1);
      }, 260);
    },
    [current, leaving, stop],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') navigate({ name: 'deck', id: deckId });
      if (done || !faces) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === 'ArrowRight' || e.key === 'k')) rate(true);
      else if (flipped && (e.key === 'ArrowLeft' || e.key === 'j')) rate(false);
      else if (e.key === 's' && supported) {
        const face = flipped ? faces.answer : faces.question;
        speak(face.text, face.lang, flipped ? 'a' : 'q');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deckId, done, faces, flipped, rate, speak, supported]);

  if (!deck) {
    return (
      <div className="empty">
        <p>Diesen Stapel gibt es nicht mehr.</p>
        <a className="btn btn--primary" href={href({ name: 'home' })}>
          Zur Übersicht
        </a>
      </div>
    );
  }

  if (deckCards.length === 0) {
    return (
      <div className="empty">
        <p>In diesem Stapel sind noch keine Karten.</p>
        <a className="btn btn--primary" href={href({ name: 'deck', id: deck.id })}>
          Karten hinzufügen
        </a>
      </div>
    );
  }

  const progress = queue.length ? index / queue.length : 0;

  return (
    <div className="study">
      <header className="study__bar">
        <a className="icon-btn" href={href({ name: 'deck', id: deck.id })} aria-label="Lernen beenden">
          <ArrowLeft size={22} />
        </a>
        <div className="study__title">
          <span>
            {deck.emoji} {deck.name}
          </span>
          {tag && <small>{tag}</small>}
        </div>
        <div className="segmented segmented--icons" role="group" aria-label="Lernrichtung">
          {DIRECTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className={direction === value ? 'is-active' : ''}
              onClick={() => {
                setDirection(value);
                actions.updateSettings({ direction: value });
                restart(value);
              }}
              aria-label={label}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </header>

      <div className="study__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span>
          {Math.min(index + 1, queue.length)} / {queue.length}
        </span>
      </div>

      {!done && faces && current ? (
        <>
          <div className={`study__stage ${leaving ? `leaving-${leaving}` : ''}`} key={`${current.card.id}-${index}`}>
            <FlipCard
              question={faces.question}
              answer={faces.answer}
              example={faces.example}
              note={current.card.note}
              tag={current.card.tag}
              color={deck.color}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              onSwipe={rate}
              speak={speak}
              speakingKey={speakingKey}
              speechSupported={supported}
            />
          </div>

          <div className={`study__actions ${flipped ? 'is-visible' : ''}`}>
            <button className="rate-btn rate-btn--again" onClick={() => rate(false)} disabled={!flipped}>
              <X size={22} />
              <span>Nochmal</span>
            </button>
            <button className="rate-btn rate-btn--known" onClick={() => rate(true)} disabled={!flipped}>
              <Check size={22} />
              <span>Gewusst</span>
            </button>
          </div>
          <p className="study__hint">
            <span className="only-touch">{flipped ? 'Wische nach rechts oder links, um zu bewerten' : 'Tippe auf die Karte, um sie umzudrehen'}</span>
            <span className="only-pointer">
              <kbd>Leertaste</kbd> umdrehen · <kbd>←</kbd> nochmal · <kbd>→</kbd> gewusst · <kbd>S</kbd> vorlesen
            </span>
          </p>
        </>
      ) : (
        <div className="study__done">
          <div className="study__done-icon">
            <PartyPopper size={36} />
          </div>
          <h2>Runde geschafft!</h2>
          <p>
            Du hast {sessionUnique} {sessionUnique === 1 ? 'Karte' : 'Karten'} gelernt.
          </p>
          <ProgressRing value={result.known / Math.max(1, result.known + result.again)} size={120} stroke={10} />
          <div className="study__done-stats">
            <span className="stat stat--known">
              <Check size={16} /> {result.known} gewusst
            </span>
            <span className="stat stat--again">
              <RotateCcw size={16} /> {result.again}× wiederholt
            </span>
          </div>
          <div className="study__done-actions">
            <button className="btn btn--primary" onClick={() => restart()}>
              <RotateCcw size={18} /> Noch eine Runde
            </button>
            <a className="btn btn--ghost" href={href({ name: 'deck', id: deck.id })}>
              Zurück zum Stapel
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
