import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Rating } from '../lib/srs';
import type { CardFace } from './FlipCard';
import { SpeakButton } from './SpeakButton';

export interface QuizResult {
  correct: boolean;
  rating: Rating;
  /** Index of the option tapped. */
  picked: number;
}

interface Props {
  question: CardFace;
  example?: CardFace;
  note?: string;
  tag?: string;
  /** All options, the right one included. */
  options: string[];
  correct: number;
  result: QuizResult | null;
  leaving: boolean;
  onPick: (index: number) => void;
  onContinue: () => void;
  speak: (text: string, lang: string, key: string) => void;
  speakingKey: string | null;
  speechSupported: boolean;
}

function sizeClass(text: string) {
  if (text.length <= 18) return 'card-text--xl';
  if (text.length <= 40) return 'card-text--lg';
  if (text.length <= 90) return 'card-text--md';
  return 'card-text--sm';
}

/** A multiple choice question: the card's question plus a few answers to pick from. */
export function QuizCard(props: Props) {
  const { question, example, note, tag, options, correct, result, leaving, onPick, onContinue, speak, speakingKey, speechSupported } = props;
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (result) next.current?.focus({ preventScroll: true });
  }, [result]);

  return (
    <div className={`quiz ${leaving ? 'is-leaving' : ''}`}>
      <div className={`quiz-card ${result ? (result.correct ? 'is-right' : 'is-wrong') : ''}`}>
        <div className="flip-face__top">
          {tag ? <span className="chip chip--sm">{tag}</span> : <span />}
          {speechSupported && (
            <SpeakButton active={speakingKey === 'q'} onSpeak={() => speak(question.text, question.lang, 'q')} label="Frage vorlesen" />
          )}
        </div>
        <p className={`card-q quiz-card__q ${sizeClass(question.text)}`}>{question.text}</p>

        {result && (example || note) && (
          <div className="quiz-card__reveal">
            {example && (
              <div className="card-example">
                <p>“{example.text}”</p>
                {speechSupported && (
                  <SpeakButton small active={speakingKey === 'e'} onSpeak={() => speak(example.text, example.lang, 'e')} label="Beispiel vorlesen" />
                )}
              </div>
            )}
            {note && (
              <div className="card-note">
                <span>Merkhilfe</span>
                <p>{note}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="quiz-options" role="group" aria-label="Antworten">
        {options.map((text, i) => {
          const state = !result ? '' : i === correct ? 'is-right' : i === result.picked ? 'is-wrong' : 'is-dim';
          return (
            <button key={i} type="button" className={`quiz-option ${state}`} onClick={() => onPick(i)} disabled={!!result}>
              <kbd className="only-pointer">{i + 1}</kbd>
              <span>{text}</span>
              {state === 'is-right' && <Check size={18} className="quiz-option__icon" />}
              {state === 'is-wrong' && <X size={18} className="quiz-option__icon" />}
            </button>
          );
        })}
      </div>

      {result && (
        <div className="quiz-result">
          <p className={`quiz-result__text ${result.correct ? 'is-right' : 'is-wrong'}`} role="status">
            {result.correct ? <Check size={18} /> : <X size={18} />}
            {result.correct ? 'Richtig' : 'Leider falsch'}
          </p>
          <button ref={next} type="button" className="btn btn--primary btn--xl" onClick={onContinue}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
