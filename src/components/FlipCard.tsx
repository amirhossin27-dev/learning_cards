import { useEffect, useRef, type PointerEvent } from 'react';
import { SpeakButton } from './SpeakButton';

export interface CardFace {
  text: string;
  lang: string;
}

interface Props {
  question: CardFace;
  answer: CardFace;
  example?: CardFace;
  note?: string;
  tag?: string;
  flipped: boolean;
  onFlip: () => void;
  /** Called with true (swipe right, "Gut") or false (swipe left, "Nochmal"). Only active once flipped. */
  onSwipe?: (known: boolean) => void;
  /** Label for a swipe to the right, e.g. "Gut" or "Gewusst". */
  knownLabel?: string;
  speak: (text: string, lang: string, key: string) => void;
  speakingKey: string | null;
  speechSupported: boolean;
}

const SWIPE_THRESHOLD = 90;
/** A quick flick counts too, even if it's short: px per ms and minimum distance. */
const FLICK_SPEED = 0.5;
const FLICK_DISTANCE = 35;

interface Drag {
  id: number;
  x: number;
  y: number;
  moved: boolean;
  dx: number;
  /** Horizontal speed in px/ms, smoothed over the last moves. */
  vx: number;
  lastX: number;
  lastT: number;
}

function sizeClass(text: string) {
  if (text.length <= 18) return 'card-text--xl';
  if (text.length <= 40) return 'card-text--lg';
  if (text.length <= 90) return 'card-text--md';
  return 'card-text--sm';
}

export function FlipCard(props: Props) {
  const { question, answer, example, note, tag, flipped, onFlip, onSwipe, knownLabel = 'Gut', speak, speakingKey, speechSupported } = props;
  const scene = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const frame = useRef(0);
  // Swiping rates the card, so it only follows the finger once the answer is visible.
  const canSwipe = flipped && !!onSwipe;

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // The card follows the finger by writing styles directly, so React doesn't re-render on every move.
  const paint = (dx: number) => {
    const el = scene.current;
    if (!el) return;
    el.style.transform = dx ? `translate3d(${dx}px, 0, 0) rotate(${dx / 18}deg)` : '';
    el.style.setProperty('--pull', String(Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)));
    if (canSwipe && dx) el.dataset.swipe = dx > 0 ? 'known' : 'again';
    else delete el.dataset.swipe;
  };

  const release = () => {
    cancelAnimationFrame(frame.current);
    if (scene.current) delete scene.current.dataset.dragging;
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button > 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, dx: 0, vx: 0, lastX: e.clientX, lastT: e.timeStamp };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    const el = scene.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        // Scrolling the back of the card, not a swipe and not a tap.
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = '';
    }
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.vx = 0.7 * ((e.clientX - d.lastX) / dt) + 0.3 * d.vx;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    // Before the answer is shown the card only gives a little, so it still feels alive.
    d.dx = canSwipe ? dx : dx * 0.2;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => paint(d.dx));
  };

  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) {
      onFlip();
      return;
    }
    release();
    const dir = Math.sign(d.dx);
    const flick = Math.abs(d.vx) > FLICK_SPEED && Math.abs(d.dx) > FLICK_DISTANCE && Math.sign(d.vx) === dir;
    const el = scene.current;
    if (canSwipe && el && (Math.abs(d.dx) > SWIPE_THRESHOLD || flick)) {
      // Fly out from where the finger let go instead of jumping back first.
      el.dataset.flying = '';
      el.style.transform = `translate3d(${dir * window.innerWidth * 1.1}px, 0, 0) rotate(${dir * 16}deg)`;
      el.style.opacity = '0';
      onSwipe!(dir > 0);
    } else {
      paint(0);
    }
  };

  const onPointerCancel = () => {
    drag.current = null;
    release();
    paint(0);
  };

  return (
    <div
      ref={scene}
      className="flip-scene"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Antwort, antippen zum Zurückdrehen' : 'Frage, antippen zum Umdrehen'}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onFlip();
      }}
    >
      <div className={`flip-card ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-face flip-face--front" aria-hidden={flipped}>
          <div className="flip-face__top">
            {tag ? <span className="chip chip--sm">{tag}</span> : <span />}
            {speechSupported && (
              <SpeakButton active={speakingKey === 'q'} onSpeak={() => speak(question.text, question.lang, 'q')} label="Frage vorlesen" />
            )}
          </div>
          <p className={`card-q ${sizeClass(question.text)}`}>{question.text}</p>
          <span className="flip-face__hint">Tippen zum Umdrehen</span>
        </div>

        <div className="flip-face flip-face--back" aria-hidden={!flipped}>
          <div className="card-ref">
            <span>{question.text}</span>
            {speechSupported && (
              <SpeakButton small active={speakingKey === 'q'} onSpeak={() => speak(question.text, question.lang, 'q')} label="Frage vorlesen" />
            )}
          </div>
          <div className="flip-face__content">
            <p className="card-meta">{tag ? `Antwort · ${tag}` : 'Antwort'}</p>
            <div className="card-a-row">
              <p className={`card-a ${sizeClass(answer.text)}`}>{answer.text}</p>
              {speechSupported && (
                <SpeakButton small active={speakingKey === 'a'} onSpeak={() => speak(answer.text, answer.lang, 'a')} label="Antwort vorlesen" />
              )}
            </div>
            {example && (
              <div className="card-example">
                <p>“{example.text}”</p>
                {speechSupported && (
                  <SpeakButton small active={speakingKey === 'e'} onSpeak={() => speak(example.text, example.lang, 'e')} label="Beispiel vorlesen" />
                )}
              </div>
            )}
          </div>
          {note && (
            <div className="card-note">
              <span>Merkhilfe</span>
              <p>{note}</p>
            </div>
          )}
        </div>
      </div>
      <div className="swipe-badge swipe-badge--known" aria-hidden="true">
        {knownLabel}
      </div>
      <div className="swipe-badge swipe-badge--again" aria-hidden="true">
        Nochmal
      </div>
    </div>
  );
}
