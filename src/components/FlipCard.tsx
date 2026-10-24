import { useRef, useState, type PointerEvent } from 'react';
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

function sizeClass(text: string) {
  if (text.length <= 18) return 'card-text--xl';
  if (text.length <= 40) return 'card-text--lg';
  if (text.length <= 90) return 'card-text--md';
  return 'card-text--sm';
}

export function FlipCard(props: Props) {
  const { question, answer, example, note, tag, flipped, onFlip, onSwipe, knownLabel = 'Gut', speak, speakingKey, speechSupported } = props;
  const [dragX, setDragX] = useState(0);
  const drag = useRef<{ x: number; y: number; moved: boolean; id: number } | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (d.moved && flipped && onSwipe) setDragX(dx);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      onFlip();
      return;
    }
    if (flipped && onSwipe && Math.abs(dragX) > SWIPE_THRESHOLD) onSwipe(dragX > 0);
    setDragX(0);
  };

  const pull = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);
  const swipe = dragX > 0 ? 'known' : dragX < 0 ? 'again' : '';

  return (
    <div
      className={`flip-scene ${swipe ? `swipe-${swipe}` : ''}`}
      style={{
        transform: dragX ? `translateX(${dragX}px) rotate(${dragX / 16}deg)` : undefined,
        ['--pull' as string]: pull,
      }}
      data-dragging={dragX !== 0 || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setDragX(0);
      }}
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
