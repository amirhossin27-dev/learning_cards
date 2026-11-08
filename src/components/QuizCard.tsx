import { Check, CornerDownLeft, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Verdict } from '../lib/quiz';
import type { Rating } from '../lib/srs';
import type { CardFace } from './FlipCard';
import { SpeakButton } from './SpeakButton';

export interface QuizResult {
  correct: boolean;
  rating: Rating;
  /** Index of the option tapped (multiple choice). */
  picked?: number;
  /** What was typed (typing). */
  typed?: string;
  verdict?: Verdict;
}

interface Props {
  kind: 'choice' | 'type';
  question: CardFace;
  answer: CardFace;
  example?: CardFace;
  note?: string;
  tag?: string;
  /** Multiple choice: all options, the right one included. */
  options?: string[];
  correct?: number;
  /** Shown when typing was chosen but this card's answer is too long for it. */
  fallback?: boolean;
  result: QuizResult | null;
  leaving: boolean;
  onPick: (index: number) => void;
  onSubmit: (text: string) => void;
  onGiveUp: () => void;
  onContinue: () => void;
  /** "Ich lag doch richtig": counts a typed answer as right after all. */
  onOverride: () => void;
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

const VERDICT_TEXT: Record<Verdict, string> = {
  exact: 'Richtig',
  typo: 'Fast richtig, nur ein kleiner Tippfehler',
  wrong: 'Leider falsch',
};

export function QuizCard(props: Props) {
  const { kind, question, answer, example, note, tag, options = [], correct, fallback, result, leaving } = props;
  const { onPick, onSubmit, onGiveUp, onContinue, onOverride, speak, speakingKey, speechSupported } = props;
  const [typed, setTyped] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (kind === 'type' && !result) input.current?.focus({ preventScroll: true });
  }, [kind, result]);

  useEffect(() => {
    if (result) next.current?.focus({ preventScroll: true });
  }, [result]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (result) return;
    if (typed.trim()) onSubmit(typed);
  };

  const verdict: Verdict | undefined = result ? (result.verdict ?? (result.correct ? 'exact' : 'wrong')) : undefined;
  const showAnswer = !!result && (kind === 'type' || !result.correct);

  return (
    <div className={`quiz ${leaving ? 'is-leaving' : ''}`}>
      <div className={`quiz-card ${result ? (result.correct ? 'is-right' : 'is-wrong') : ''}`}>
        <div className="flip-face__top">
          <span className="quiz-card__chips">
            {tag && <span className="chip chip--sm">{tag}</span>}
            {fallback && <span className="chip chip--sm">Lange Antwort: als Auswahl</span>}
          </span>
          {speechSupported && (
            <SpeakButton active={speakingKey === 'q'} onSpeak={() => speak(question.text, question.lang, 'q')} label="Frage vorlesen" />
          )}
        </div>
        <p className={`card-q quiz-card__q ${sizeClass(question.text)}`}>{question.text}</p>

        {result && (
          <div className="quiz-card__reveal">
            {showAnswer && (
              <>
                <p className="card-meta">Richtige Antwort</p>
                <div className="card-a-row">
                  <p className={`card-a ${sizeClass(answer.text)}`}>{answer.text}</p>
                  {speechSupported && (
                    <SpeakButton small active={speakingKey === 'a'} onSpeak={() => speak(answer.text, answer.lang, 'a')} label="Antwort vorlesen" />
                  )}
                </div>
              </>
            )}
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

      {kind === 'choice' ? (
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
      ) : (
        <form className="quiz-type" onSubmit={submit}>
          <div className={`quiz-input ${verdict ? `is-${verdict}` : ''}`}>
            <input
              ref={input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Deine Antwort"
              aria-label="Deine Antwort"
              lang={answer.lang}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              disabled={!!result}
            />
            {!result && (
              <button type="submit" className="quiz-input__go" aria-label="Prüfen" disabled={!typed.trim()}>
                <CornerDownLeft size={18} />
              </button>
            )}
          </div>
          {!result && (
            <button type="button" className="btn btn--ghost quiz-type__skip" onClick={onGiveUp}>
              Weiß ich nicht
            </button>
          )}
        </form>
      )}

      {result && verdict && (
        <div className="quiz-result">
          <p className={`quiz-result__text is-${verdict}`} role="status">
            {verdict === 'wrong' ? <X size={18} /> : <Check size={18} />}
            {result.typed === '' ? 'Nicht gewusst' : VERDICT_TEXT[verdict]}
          </p>
          <div className="quiz-result__actions">
            {kind === 'type' && !result.correct && result.typed !== '' && (
              <button type="button" className="btn btn--secondary btn--lg" onClick={onOverride}>
                Ich lag doch richtig
              </button>
            )}
            <button ref={next} type="button" className="btn btn--primary btn--lg" onClick={onContinue}>
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
