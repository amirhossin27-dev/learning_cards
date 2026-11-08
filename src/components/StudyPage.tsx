import { ArrowLeftRight, Check, Dumbbell, Ellipsis, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { useToday } from '../hooks/useToday';
import { href, navigate, type StudyMode } from '../lib/router';
import { availableMethods, buildQuestion, isPairable, pairChunk, type Question } from '../lib/questions';
import { autoRating, FAST_ANSWER, isMethod, METHODS, type StudyMethod } from '../lib/quiz';
import { resolveLang, useSpeech } from '../lib/speech';
import { BOX_LABELS, formatWait, isNew, previewWaits, RATINGS, repeatsInSession, schedule, type Rating } from '../lib/srs';
import { actions, buildPractice, buildSession, getState, HARD_ROUND, hardCards, newCardsLeft, planToday, shuffle, useAppData } from '../lib/store';
import type { Card, Direction } from '../types';
import { FlipCard } from './FlipCard';
import { ProgressRing } from './ProgressRing';
import { PairsBoard, type Pair } from './PairsBoard';
import { QuizCard, type QuizResult } from './QuizCard';
import { METHOD_ICONS } from './StudyLauncher';

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

const HINTS: Record<Question['kind'], string> = {
  choice: 'Tippe auf die richtige Antwort',
  cloze: 'Tippe auf das Wort, das in die Lücke gehört',
  listen: 'Hör zu und tippe auf die Bedeutung',
  truefalse: 'Stimmt die Antwort? Tippe auf Richtig oder Falsch',
};

const MODE_LABELS: Record<StudyMode, string> = { extra: 'Freies Üben', new: 'Neue Karten', hard: 'Schwierige Karten' };

let nextKey = 1;
const pickReversed = (direction: Direction) => direction === 'back' || (direction === 'mixed' && Math.random() < 0.5);

function buildQueue(deckId: string | undefined, tag: string | undefined, mode: StudyMode | undefined, direction: Direction): QueueItem[] {
  const s = getState();
  const scoped = s.cards.filter((c) => (!deckId || c.deckId === deckId) && (!tag || c.tag === tag));
  const order = s.decks.map((d) => d.id);
  const { sessionSize, newPerDay } = s.settings;
  let list: Card[];
  if (mode === 'extra') list = buildPractice(scoped, sessionSize);
  else if (mode === 'hard') list = hardCards(scoped).slice(0, HARD_ROUND);
  // One more batch of new cards, as many as a day's budget.
  else if (mode === 'new') list = planToday(scoped, sessionSize > 0 ? Math.min(sessionSize, newPerDay) : newPerDay, order).fresh;
  else list = buildSession(planToday(scoped, newCardsLeft(s), order), sessionSize);
  // Which cards come up is decided above; the order they are shown in is random every time.
  return shuffle(list).map((card) => ({ card, reversed: pickReversed(direction), key: nextKey++ }));
}

/** "3 Tage" → "in 3 Tagen", "< 1 Min." → "gleich". */
function inWait(ms: number) {
  const text = formatWait(ms);
  return text.startsWith('<') ? 'gleich' : `in ${text.replace(/Tage$/, 'Tagen')}`;
}

export function StudyPage({ deckId, tag, mode }: Props) {
  const { decks, cards, settings } = useAppData();
  const { reviews, goal } = useToday();
  // Extra and difficult rounds count for the daily goal but leave the schedule as it is.
  const practice = mode === 'extra' || mode === 'hard';
  const methodKey = deckId ?? (mode === 'hard' ? 'hard' : 'today');
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined;
  const scoped = useMemo(() => cards.filter((c) => (!deckId || c.deckId === deckId) && (!tag || c.tag === tag)), [cards, deckId, tag]);
  const scopeSize = scoped.length;
  const scopeNew = useMemo(() => scoped.filter(isNew).length, [scoped]);
  const { speak, stop, speakingKey, supported } = useSpeech(settings.speechRate);

  const [direction, setDirection] = useState<Direction>(settings.direction);
  const [queue, setQueue] = useState<QueueItem[]>(() => buildQueue(deckId, tag, mode, settings.direction));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // 'swipe': the card already flies out on its own from where the finger let go.
  const [leaving, setLeaving] = useState<'left' | 'right' | 'swipe' | null>(null);
  // "type" was a short-lived typing method; whoever picked it gets multiple choice now.
  const [method, setMethod] = useState<StudyMethod>(() => {
    const saved: string | undefined = settings.methods?.[methodKey];
    return isMethod(saved) ? saved : saved === 'type' ? 'choice' : 'flip';
  });
  const [result, setResult] = useState<QuizResult | null>(null);
  const shownAt = useRef(Date.now());
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
    setResult(null);
    setTally({ answers: 0, again: 0 });
  }, [deckId, tag, mode, direction, stop]);

  const changeDirection = (value: Direction) => {
    setDirection(value);
    actions.updateSettings({ direction: value });
    setQueue((q) => q.map((item, i) => (i < index ? item : { ...item, reversed: pickReversed(value) })));
    setFlipped(false);
    setResult(null);
    setMenuOpen(false);
  };

  const changeMethod = (value: StudyMethod) => {
    setMethod(value);
    actions.updateSettings({ methods: { ...getState().settings.methods, [methodKey]: value } });
    setFlipped(false);
    setResult(null);
    shownAt.current = Date.now();
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

  // Gaps need example sentences, listening a language deck, pairs short cards: only offer what fits.
  const methods = useMemo(() => availableMethods(scoped, decks, supported), [scoped, decks, supported]);
  const activeMethod: StudyMethod = methods.includes(method) ? method : 'flip';

  // For pairs, the short cards still to come move to the front, so a round isn't cut short by a long one in between.
  useEffect(() => {
    if (activeMethod !== 'pairs') return;
    setQueue((q) => {
      const rest = q.slice(index);
      // A card that comes twice (answered wrong earlier) can't be in the same round of pairs, so its second turn waits.
      const seen = new Set<string>();
      const first = (item: QueueItem) => isPairable(item) && !seen.has(item.card.id) && !!seen.add(item.card.id);
      const front = rest.filter(first);
      const sorted = [...front, ...rest.filter((item) => !front.includes(item))];
      return sorted.every((item, i) => item === rest[i]) ? q : [...q.slice(0, index), ...sorted];
    });
  }, [activeMethod, index]);

  // Pairs take up to five cards at once. Built once per round of pairs (keyed by its queue entries), so the tiles don't reshuffle.
  const pairKeys =
    activeMethod === 'pairs'
      ? queue
          .slice(index, index + pairChunk(queue, index))
          .map((item) => item.key)
          .join(',')
      : '';
  const pairs = useMemo<Pair[] | null>(() => {
    const keys = pairKeys.split(',');
    if (keys.length < 2) return null;
    return keys.map((key) => {
      const item = queue.find((i) => String(i.key) === key)!;
      return {
        id: item.card.id,
        question: item.reversed ? item.card.back : item.card.front,
        answer: item.reversed ? item.card.front : item.card.back,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairKeys]);

  // Built once per card (and method), so the options don't reshuffle while answering.
  const quiz = useMemo<Question | null>(() => {
    if (!current || pairs) return null;
    const s = getState();
    const data = { cards: s.cards, decks: s.decks };
    if (activeMethod === 'pairs') {
      const q = buildQuestion(current, 'choice', data);
      return q && { ...q, fallback: 'Zu lang für Paare: als Auswahl' };
    }
    return buildQuestion(current, activeMethod, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key, current?.reversed, activeMethod, pairs]);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [current?.key]);

  // Listening plays the question on its own; it can be repeated with the big button.
  useEffect(() => {
    if (quiz?.kind === 'listen' && faces) speak(faces.question.text, faces.question.lang, 'q');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key, quiz]);

  // Labels under the answer buttons are computed when the card is turned, so they match the moment of answering.
  const waits = useMemo(() => (flipped && live && !practice ? previewWaits(live, Date.now()) : null), [flipped, live, practice]);

  // Auto-speak the question whenever a new card appears (not in a gap, where the word is the answer, nor while matching pairs).
  useEffect(() => {
    const silent = pairs || quiz?.kind === 'cloze' || quiz?.kind === 'listen';
    if (settings.autoSpeak && faces && !flipped && !silent) speak(faces.question.text, faces.question.lang, 'q');
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
    (rating: Rating, swiped = false) => {
      if (!current || leaving) return;
      stop();
      const now = Date.now();
      const latest = getState().cards.find((c) => c.id === current.card.id) ?? current.card;
      actions.reviewCard(latest.id, rating, practice);
      studied.current.add(latest.id);

      const repeat = practice ? rating === 1 : repeatsInSession(latest, rating);
      if (repeat) setQueue((q) => [...q, { ...current, key: nextKey++ }]);
      setTally((t) => ({ answers: t.answers + 1, again: t.again + (rating === 1 ? 1 : 0) }));

      let text: string | null = null;
      if (repeat) text = rating === 1 ? 'Kommt gleich nochmal' : 'Kommt in dieser Runde wieder';
      else if (!practice) {
        const next = schedule(latest, rating, now);
        const moved = next.box !== latest.box ? `${BOX_LABELS[latest.box]} → ${BOX_LABELS[next.box]}` : BOX_LABELS[next.box];
        text = `${moved} · wieder ${inWait(next.due - now)}`;
      }
      if (text) setFeedback({ text, id: now });

      setLeaving(swiped ? 'swipe' : rating >= 3 ? 'right' : 'left');
      window.setTimeout(() => {
        setLeaving(null);
        setFlipped(false);
        setResult(null);
        setIndex((i) => i + 1);
      }, 280);
    },
    [current, leaving, stop, practice],
  );

  const elapsed = () => Date.now() - shownAt.current;

  const pick = useCallback(
    (i: number) => {
      if (!quiz || result || leaving) return;
      const correct = i === quiz.correct;
      // Right or wrong can be guessed half the time, so it never counts as "Leicht".
      const rating = quiz.kind === 'truefalse' ? (correct ? 3 : 1) : autoRating(correct, elapsed(), quiz.kind === 'cloze' ? FAST_ANSWER * 1.5 : FAST_ANSWER);
      setResult({ correct, picked: i, rating });
    },
    [quiz, result, leaving],
  );

  /** Applies a whole round of pairs: found on the first try = Gut, with a wrong attempt = Nochmal. */
  const ratePairs = useCallback(
    (mistakes: Record<string, number>) => {
      if (!pairs || leaving) return;
      stop();
      const items = queue.slice(index, index + pairs.length);
      const repeats: QueueItem[] = [];
      let again = 0;
      for (const item of items) {
        const latest = getState().cards.find((c) => c.id === item.card.id) ?? item.card;
        const rating: Rating = mistakes[item.card.id] ? 1 : 3;
        actions.reviewCard(latest.id, rating, practice);
        studied.current.add(latest.id);
        if (rating === 1) again++;
        if (practice ? rating === 1 : repeatsInSession(latest, rating)) repeats.push({ ...item, key: nextKey++ });
      }
      if (repeats.length) setQueue((q) => [...q, ...repeats]);
      setTally((t) => ({ answers: t.answers + items.length, again: t.again + again }));
      const text = again ? `${items.length - again} von ${items.length} auf Anhieb · ${again === 1 ? 'eine kommt' : `${again} kommen`} nochmal` : `${items.length} Paare auf Anhieb`;
      setFeedback({ text, id: Date.now() });
      setLeaving('right');
      window.setTimeout(() => {
        setLeaving(null);
        setFlipped(false);
        setResult(null);
        setIndex((i) => i + items.length);
      }, 280);
    },
    [pairs, leaving, stop, queue, index, practice],
  );

  const continueQuiz = useCallback(() => {
    if (result) rate(result.rating);
  }, [result, rate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        else navigate(deckId ? { name: 'deck', id: deckId } : { name: 'home' });
        return;
      }
      if (done || !faces) return;
      // A focused button handles Enter and Space itself.
      if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
      if (pairs) return;
      if (quiz) {
        if (result && (e.key === 'Enter' || e.key === 'ArrowRight')) {
          e.preventDefault();
          continueQuiz();
        } else if (!result && quiz.kind === 'truefalse' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) pick(e.key === 'ArrowLeft' ? 0 : 1);
        else if (!result && /^[1-9]$/.test(e.key) && Number(e.key) <= quiz.options.length) pick(Number(e.key) - 1);
        else if (e.key === 's' && supported) speak(faces.question.text, faces.question.lang, 'q');
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === 'ArrowRight' || e.key === '3')) rate(3);
      else if (flipped && (e.key === 'ArrowLeft' || e.key === '1')) rate(1);
      else if (flipped && !practice && e.key === '2') rate(2);
      else if (flipped && !practice && e.key === '4') rate(4);
      else if (e.key === 's' && supported) {
        const face = flipped ? faces.answer : faces.question;
        speak(face.text, face.lang, flipped ? 'a' : 'q');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deckId, done, faces, flipped, rate, speak, supported, practice, menuOpen, quiz, pairs, result, continueQuiz, pick]);

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
        <h2>
          {mode === 'hard' ? 'Gerade keine schwierigen Karten' : mode === 'new' ? 'Hier gibt es keine neuen Karten mehr' : 'Für heute ist hier nichts mehr fällig'}
        </h2>
        <p>
          {mode === 'hard'
            ? 'Hier landen Karten, die du zuletzt falsch beantwortet oder nach dem Lernen wieder vergessen hast. '
            : ''}
          {offerNew
            ? `Du kannst mit ${scopeNew === 1 ? 'der letzten neuen Karte' : `${scopeNew} neuen Karten`} weitermachen oder frei üben, ohne dass sich Termine verschieben.`
            : 'Mit Freiem Üben kannst du trotzdem weitermachen. Es zählt für dein Tagesziel, verschiebt aber keine Termine.'}
        </p>
        <div className="empty__actions">
          {offerNew && (
            <a className="btn btn--primary" href={href({ name: 'study', id: deckId, tag, mode: 'new' })}>
              <Plus size={18} /> Neue Karten lernen
            </a>
          )}
          <a className={`btn ${offerNew ? 'btn--secondary' : 'btn--primary'}`} href={href({ name: 'study', id: deckId, tag, mode: 'extra' })}>
            <Dumbbell size={18} /> Frei üben
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
          <div className="study__top">
            <p className="study__deck" data-marker={cardDeck.color % 6}>
              <i className="marker-tab" aria-hidden="true" />
              <span>{deck ? title : cardDeck.name}</span>
              {tag && <span className="muted">· {tag}</span>}
              {mode && <span className="chip chip--sm">{MODE_LABELS[mode]}</span>}
            </p>
            <div className="segmented segmented--sm study__methods" role="radiogroup" aria-label="Lernmethode">
              {METHODS.filter((m) => methods.includes(m.value)).map(({ value, label }) => {
                const Icon = METHOD_ICONS[value];
                const active = activeMethod === value;
                return (
                  <button key={value} role="radio" aria-checked={active} className={active ? 'is-active' : ''} onClick={() => changeMethod(value)}>
                    <Icon size={15} /> {label}
                  </button>
                );
              })}
            </div>
          </div>

          {pairs ? (
            <>
              <PairsBoard key={current.key} pairs={pairs} leaving={!!leaving} onDone={ratePairs} />
              <div className="study__actions">
                {feedback && (
                  <p className="study__feedback study__feedback--top" key={feedback.id} role="status">
                    {feedback.text}
                  </p>
                )}
              </div>
            </>
          ) : quiz ? (
            <>
              <QuizCard
                key={current.key}
                q={quiz}
                question={faces.question}
                answer={faces.answer}
                example={faces.example}
                note={live.note}
                tag={live.tag}
                meaning={live.back}
                result={result}
                leaving={!!leaving}
                onPick={pick}
                onContinue={continueQuiz}
                speak={speak}
                speakingKey={speakingKey}
                speechSupported={supported}
              />
              <div className="study__actions">
                {feedback && (
                  <p className="study__feedback study__feedback--top" key={feedback.id} role="status">
                    {feedback.text}
                  </p>
                )}
                <p className="study__hint">
                  <span className="only-touch">{HINTS[quiz.kind]}</span>
                  <span className="only-pointer">
                    {quiz.kind === 'truefalse' ? (
                      <>
                        <kbd>←</kbd> falsch · <kbd>→</kbd> richtig
                      </>
                    ) : (
                      <>
                        <kbd>1</kbd>–<kbd>{quiz.options.length}</kbd> auswählen
                      </>
                    )}{' '}
                    · <kbd>Enter</kbd> weiter · <kbd>S</kbd> {quiz.kind === 'listen' ? 'nochmal hören' : 'vorlesen'}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
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
                onSwipe={(known) => rate(known ? 3 : 1, true)}
                knownLabel={practice ? 'Gewusst' : 'Gut'}
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
            ) : practice ? (
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
                <kbd>Leertaste</kbd> umdrehen · {practice ? <><kbd>←</kbd> nochmal · <kbd>→</kbd> gewusst</> : <><kbd>1</kbd>–<kbd>4</kbd> bewerten</>} ·{' '}
                <kbd>S</kbd> vorlesen
              </span>
            </p>
          </div>
            </>
          )}
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
          {mode === 'extra' ? <Dumbbell size={18} /> : mode === 'new' ? <Plus size={18} /> : <RotateCcw size={18} />}{' '}
          {mode === 'new' ? 'Weitere neue Karten' : 'Noch eine Runde'}
        </button>
        <a className="btn btn--ghost btn--lg" href={exitHref}>
          Fertig
        </a>
      </div>
    </div>
  );
}
