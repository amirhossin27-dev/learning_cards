import { ArrowLeftRight, Check, Ellipsis, Play, RotateCcw, Target } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { useToday } from '../hooks/useToday';
import { href, navigate, type StudyMode } from '../lib/router';
import { availableMethods, buildQuestion, cardMethods, closestMethod, isPairable, methodFor, pairChunk, type Question } from '../lib/questions';
import { autoRating, FAST_ANSWER, METHODS, savedMethod, type StudyMethod } from '../lib/quiz';
import { playTone } from '../lib/sounds';
import { resolveLang, useSpeech } from '../lib/speech';
import { formatWait, previewWaits, RATINGS, repeatsInSession, schedule, stageOf, type Rating } from '../lib/srs';
import { actions, buildStream, getState, HARD_ROUND, hardCards, planToday, REPEAT_LATER, REPEAT_SOON, requeue, shuffle, useAppData } from '../lib/store';
import type { Card, Direction } from '../types';
import { FlipCard } from './FlipCard';
import { PairsBoard, type Pair } from './PairsBoard';
import { QuizCard, type QuizResult } from './QuizCard';
import { METHOD_ICONS } from './StudyLauncher';

interface Props {
  /** Undefined = learn across all decks. */
  deckId?: string;
  tag?: string;
  /** Undefined = just keep learning. See `StudyMode`. */
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
  truefalse: 'Stimmt die Antwort? Tippe auf Richtig oder Falsch',
};

const MODE_LABELS: Record<StudyMode, string> = { hard: 'Schwierige Karten' };

/** In pairs, only the next few cards are regrouped, so cards that come back soon stay close. */
const PAIR_LOOKAHEAD = 12;

let nextKey = 1;
const pickReversed = (direction: Direction) => direction === 'back' || (direction === 'mixed' && Math.random() < 0.5);

function buildQueue(deckId: string | undefined, tag: string | undefined, mode: StudyMode | undefined, direction: Direction): QueueItem[] {
  const s = getState();
  const scoped = s.cards.filter((c) => (!deckId || c.deckId === deckId) && (!tag || c.tag === tag));
  const order = s.decks.map((d) => d.id);
  // No round and no daily number: everything due in random order with new cards mixed in, then the rest of the new ones.
  const list = mode === 'hard' ? shuffle(hardCards(scoped).slice(0, HARD_ROUND)) : buildStream(planToday(scoped, order));
  return list.map((card) => ({ card, reversed: pickReversed(direction), key: nextKey++ }));
}

/** "3 Tage" → "in 3 Tagen", "< 1 Min." → "gleich". */
function inWait(ms: number) {
  const text = formatWait(ms);
  return text.startsWith('<') ? 'gleich' : `in ${text.replace(/Tage$/, 'Tagen')}`;
}

export function StudyPage({ deckId, tag, mode }: Props) {
  const { decks, cards, settings } = useAppData();
  const { reviews } = useToday();
  // Practising difficult cards counts as studied today but leaves the schedule as it is.
  const practice = mode === 'hard';
  const methodKey = deckId ?? (mode === 'hard' ? 'hard' : 'today');
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined;
  const scoped = useMemo(() => cards.filter((c) => (!deckId || c.deckId === deckId) && (!tag || c.tag === tag)), [cards, deckId, tag]);
  const scopeSize = scoped.length;
  const scopeHard = useMemo(() => hardCards(scoped).length, [scoped]);
  const { speak, stop, speakingKey, supported } = useSpeech(settings.speechRate);

  const [direction, setDirection] = useState<Direction>(settings.direction);
  const [queue, setQueue] = useState<QueueItem[]>(() => buildQueue(deckId, tag, mode, settings.direction));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // 'swipe': the card already flies out on its own from where the finger let go.
  const [leaving, setLeaving] = useState<'left' | 'right' | 'swipe' | null>(null);
  // The method chosen for the round; each card is asked with it if it can be, see `methodFor`.
  const [method, setMethod] = useState<StudyMethod>(() => savedMethod(settings.methods?.[methodKey]) ?? 'flip');
  const [result, setResult] = useState<QuizResult | null>(null);
  const shownAt = useRef(Date.now());
  // What happened since the page was opened: per card whether its latest answer was right, and how often "Nochmal" came up.
  const [tally, setTally] = useState<{ cards: Record<string, boolean>; again: number }>({ cards: {}, again: 0 });
  const [feedback, setFeedback] = useState<{ text: string; id: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // "Genug für heute": shows what was learned, with the way back into the cards.
  const [stopped, setStopped] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  const current = queue[index];
  const done = stopped || index >= queue.length;
  const learned = Object.keys(tally.cards).length;
  const known = Object.values(tally.cards).filter(Boolean).length;
  const live = current ? (cards.find((c) => c.id === current.card.id) ?? current.card) : undefined;
  const cardDeck = live ? decks.find((d) => d.id === live.deckId) : undefined;
  const exitHref = deckId ? href({ name: 'deck', id: deckId }) : href({ name: 'home' });

  const restart = useCallback(() => {
    stop();
    setQueue(buildQueue(deckId, tag, mode, direction));
    setIndex(0);
    setFlipped(false);
    setResult(null);
    setStopped(false);
    setTally({ cards: {}, again: 0 });
  }, [deckId, tag, mode, direction, stop]);

  /** Leaves at once when nothing was answered yet, else shows what was learned first. */
  const finish = () => {
    stop();
    if (learned === 0) navigate(deckId ? { name: 'deck', id: deckId } : { name: 'home' });
    else setStopped(true);
  };

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

  // Gaps need example sentences, pairs short cards: only offer what fits these cards.
  const methods = useMemo(() => availableMethods(scoped), [scoped]);
  const activeMethod: StudyMethod = closestMethod(methods, method);

  // For pairs, the short cards coming up next move to the front, so a round isn't cut short by a long one in between.
  useEffect(() => {
    if (activeMethod !== 'pairs') return;
    setQueue((q) => {
      const rest = q.slice(index, index + PAIR_LOOKAHEAD);
      // A card that comes twice (answered wrong earlier) can't be in the same round of pairs, so its second turn waits.
      const seen = new Set<string>();
      const first = (item: QueueItem) => isPairable(item) && !seen.has(item.card.id) && !!seen.add(item.card.id);
      const front = rest.filter(first);
      const sorted = [...front, ...rest.filter((item) => !front.includes(item))];
      return sorted.every((item, i) => item === rest[i]) ? q : [...q.slice(0, index), ...sorted, ...q.slice(index + PAIR_LOOKAHEAD)];
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

  // The methods this card has (shown above it), and the one it is asked with. A
  // pair on its own (the next card is too long) is asked as the closest other method.
  const ownMethods = useMemo(() => (live ? cardMethods(live) : []), [live]);
  const cardMethod: StudyMethod = useMemo(() => {
    if (!live) return 'flip';
    const m = methodFor(live, activeMethod);
    if (m !== 'pairs' || pairs) return m;
    return methodFor({ ...live, methods: ownMethods.filter((x) => x !== 'pairs') }, 'pairs');
  }, [live, activeMethod, pairs, ownMethods]);

  // Built once per card (and method), so the options don't reshuffle while answering.
  const quiz = useMemo<Question | null>(() => {
    if (!current || pairs) return null;
    const s = getState();
    return buildQuestion(current, cardMethod, { cards: s.cards, decks: s.decks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key, current?.reversed, cardMethod, pairs]);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [current?.key]);

  // Labels under the answer buttons are computed when the card is turned, so they match the moment of answering.
  const waits = useMemo(() => (flipped && live && !practice ? previewWaits(live, Date.now()) : null), [flipped, live, practice]);

  // "Vorderseite automatisch vorlesen": the question is read out whenever a new card appears,
  // in every method except a gap (there the word is the answer) and pairs (five at once).
  useEffect(() => {
    const silent = pairs || quiz?.kind === 'cloze';
    if (settings.autoSpeak && faces && !flipped && !silent) speak(faces.question.text, faces.question.lang, 'q');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key, cardMethod]);

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
      // A quiz already played its tone when the answer was tapped; turning a card over is rated here.
      if (!result) playTone(rating === 1 ? 'wrong' : 'right', settings.sounds);

      // A card that isn't known yet comes back a few cards later, not at the end of everything.
      const repeat = practice ? rating === 1 : repeatsInSession(latest, rating);
      if (repeat) setQueue((q) => requeue(q, index, [{ ...current, key: nextKey++ }], rating === 1 ? REPEAT_SOON : REPEAT_LATER));
      setTally((t) => ({ cards: { ...t.cards, [latest.id]: rating !== 1 }, again: t.again + (rating === 1 ? 1 : 0) }));

      let text: string | null = null;
      if (repeat) text = rating === 1 ? 'Kommt gleich nochmal' : 'Kommt bald wieder';
      else if (!practice) {
        const next = schedule(latest, rating, now);
        const wait = inWait(next.due - now);
        const becameSolid = stageOf(next) === 'solid' && stageOf(latest) !== 'solid';
        text = becameSolid ? `Sitzt jetzt · wieder ${wait}` : `Wieder ${wait}`;
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
    [current, leaving, stop, practice, index, result, settings.sounds],
  );

  const elapsed = () => Date.now() - shownAt.current;

  const pick = useCallback(
    (i: number) => {
      if (!quiz || result || leaving) return;
      const correct = i === quiz.correct;
      // Right or wrong can be guessed half the time, so it never counts as "Leicht".
      const rating = quiz.kind === 'truefalse' ? (correct ? 3 : 1) : autoRating(correct, elapsed(), quiz.kind === 'cloze' ? FAST_ANSWER * 1.5 : FAST_ANSWER);
      setResult({ correct, picked: i, rating });
      playTone(correct ? 'right' : 'wrong', settings.sounds);
    },
    [quiz, result, leaving, settings.sounds],
  );

  /** Applies a whole round of pairs: found on the first try = Gut, with a wrong attempt = Nochmal. */
  const ratePairs = useCallback(
    (mistakes: Record<string, number>) => {
      if (!pairs || leaving) return;
      stop();
      const items = queue.slice(index, index + pairs.length);
      const repeats: QueueItem[] = [];
      const outcome: Record<string, boolean> = {};
      let again = 0;
      for (const item of items) {
        const latest = getState().cards.find((c) => c.id === item.card.id) ?? item.card;
        const rating: Rating = mistakes[item.card.id] ? 1 : 3;
        actions.reviewCard(latest.id, rating, practice);
        outcome[latest.id] = rating !== 1;
        if (rating === 1) again++;
        if (practice ? rating === 1 : repeatsInSession(latest, rating)) repeats.push({ ...item, key: nextKey++ });
      }
      if (repeats.length) setQueue((q) => requeue(q, index + items.length - 1, repeats, REPEAT_SOON));
      setTally((t) => ({ cards: { ...t.cards, ...outcome }, again: t.again + again }));
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
    return (
      <div className="empty empty--page">
        <div className="empty__icon">
          <Check size={28} />
        </div>
        <h2>{mode === 'hard' ? 'Gerade keine schwierigen Karten' : 'Hier ist gerade nichts zu lernen'}</h2>
        <p>
          {mode === 'hard'
            ? 'Hier landen Karten, die du zuletzt falsch beantwortet oder nach dem Lernen wieder vergessen hast.'
            : 'Alles ist wiederholt und es gibt keine neuen Karten mehr. Die nächsten kommen, wenn sie wieder dran sind. So bleibt das Gelernte am besten hängen.'}
        </p>
        <div className="empty__actions">
          {mode !== 'hard' && scopeHard > 0 && (
            <a className="btn btn--primary" href={href({ name: 'study', id: deckId, tag, mode: 'hard' })}>
              <Target size={18} /> Schwierige Karten üben
            </a>
          )}
          <a className="btn btn--ghost" href={exitHref}>
            Zurück
          </a>
        </div>
      </div>
    );
  }

  const remaining = queue.length - index;
  const title = deck ? deck.name : 'Heute';

  return (
    <div className="study">
      <header className="study__bar">
        <p className="study__tally" role="status">
          {learned === 0 ? (
            "Los geht's"
          ) : (
            <>
              <strong>
                {learned} {learned === 1 ? 'Karte' : 'Karten'}
              </strong>{' '}
              · {known} gewusst
            </>
          )}
        </p>
        {!done && (
          <button className="study__stop" onClick={finish}>
            {mode === 'hard' ? 'Beenden' : 'Genug für heute'}
          </button>
        )}
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
            {ownMethods.length > 1 && (
            <div className="segmented segmented--sm study__methods" role="radiogroup" aria-label="Lernmethode">
              {METHODS.filter((m) => ownMethods.includes(m.value)).map(({ value, label }) => {
                const Icon = METHOD_ICONS[value];
                const active = (pairs ? 'pairs' : cardMethod) === value;
                return (
                  <button key={value} role="radio" aria-checked={active} className={active ? 'is-active' : ''} onClick={() => changeMethod(value)}>
                    <Icon size={15} /> {label}
                  </button>
                );
              })}
            </div>
            )}
          </div>

          {pairs ? (
            <>
              <PairsBoard
                key={current.key}
                pairs={pairs}
                leaving={!!leaving}
                onDone={ratePairs}
                onMatch={(right) => playTone(right ? 'right' : 'wrong', settings.sounds)}
              />
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
                    · <kbd>Enter</kbd> weiter · <kbd>S</kbd> vorlesen
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
          cards={learned}
          known={known}
          again={tally.again}
          reviews={reviews}
          // Stopped by hand with cards still waiting: offer the way back in.
          onResume={stopped && index < queue.length ? () => setStopped(false) : undefined}
          onRestart={mode === 'hard' && scopeHard > 0 ? restart : undefined}
          exitHref={exitHref}
          stopped={stopped && index < queue.length}
          mode={mode}
        />
      )}
    </div>
  );
}

interface DoneProps {
  /** Different cards answered since the page was opened, and how many of them were known at the last try. */
  cards: number;
  known: number;
  again: number;
  /** All answers given today, also in earlier sittings. */
  reviews: number;
  /** Back into the cards, when learning was stopped by hand. */
  onResume?: () => void;
  /** Another go at the difficult cards. */
  onRestart?: () => void;
  exitHref: string;
  stopped: boolean;
  mode?: StudyMode;
}

/** What was learned, shown after "Genug für heute" or when no cards are left. */
function SessionDone({ cards, known, again, reviews, onResume, onRestart, exitHref, stopped, mode }: DoneProps) {
  const shown = useCountUp(cards);
  return (
    <div className="study__done">
      <h2>
        {stopped ? (
          <>
            Genug für <mark className="mark-draw">heute</mark>
          </>
        ) : mode === 'hard' ? (
          <>
            Alle <mark className="mark-draw">geübt</mark>
          </>
        ) : (
          <>
            Alles <mark className="mark-draw">gelernt</mark>
          </>
        )}
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
      {reviews > cards && <p className="study__done-today">Heute insgesamt {reviews} Antworten.</p>}
      <div className="study__done-actions">
        <a className="btn btn--primary btn--lg" href={exitHref}>
          Fertig
        </a>
        {onResume && (
          <button className="btn btn--ghost btn--lg" onClick={onResume}>
            <Play size={17} /> Doch weiterlernen
          </button>
        )}
        {onRestart && (
          <button className="btn btn--ghost btn--lg" onClick={onRestart}>
            <RotateCcw size={18} /> Nochmal üben
          </button>
        )}
      </div>
    </div>
  );
}
