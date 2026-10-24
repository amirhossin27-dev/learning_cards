import { Lightbulb, MessageSquareQuote } from 'lucide-react';
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
  color: number;
  flipped: boolean;
  onFlip: () => void;
  /** Called with true (swipe right, known) or false (swipe left, again). Only active once flipped. */
  onSwipe?: (known: boolean) => void;
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
  const { question, answer, example, note, tag, color, flipped, onFlip, onSwipe, speak, speakingKey, speechSupported } = props;
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

  const swipeHint = dragX > 30 ? 'known' : dragX < -30 ? 'again' : '';

  return (
    <div
      className={`flip-scene ${swipeHint ? `swipe-${swipeHint}` : ''}`}
      style={{ transform: dragX ? `translateX(${dragX}px) rotate(${dragX / 18}deg)` : undefined }}
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
        <div className={`flip-face flip-face--front grad-${color}`}>
          <div className="flip-face__top">
            {tag ? <span className="chip chip--glass">{tag}</span> : <span />}
            {speechSupported && (
              <SpeakButton active={speakingKey === 'q'} onSpeak={() => speak(question.text, question.lang, 'q')} label="Frage vorlesen" />
            )}
          </div>
          <p className={`card-text ${sizeClass(question.text)}`}>{question.text}</p>
          <span className="flip-face__hint">Tippen zum Umdrehen</span>
        </div>

        <div className="flip-face flip-face--back">
          <div className="flip-face__top">
            <span className="flip-face__label">Antwort</span>
            {speechSupported && (
              <SpeakButton active={speakingKey === 'a'} onSpeak={() => speak(answer.text, answer.lang, 'a')} label="Antwort vorlesen" />
            )}
          </div>
          <div className="flip-face__content">
            <p className={`card-text ${sizeClass(answer.text)}`}>{answer.text}</p>
            {example && (
              <div className="card-extra">
                <MessageSquareQuote size={16} />
                <p>{example.text}</p>
                {speechSupported && (
                  <SpeakButton small active={speakingKey === 'e'} onSpeak={() => speak(example.text, example.lang, 'e')} label="Beispiel vorlesen" />
                )}
              </div>
            )}
            {note && (
              <div className="card-extra card-extra--note">
                <Lightbulb size={16} />
                <p>{note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="swipe-badge swipe-badge--known">Gewusst</div>
      <div className="swipe-badge swipe-badge--again">Nochmal</div>
    </div>
  );
}
