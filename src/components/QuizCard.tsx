import { Check, Volume2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Question } from '../lib/questions';
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
  q: Question;
  question: CardFace;
  answer: CardFace;
  example?: CardFace;
  note?: string;
  tag?: string;
  /** Gap in a sentence: the meaning of the missing term, as a hint. */
  meaning?: string;
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

const RESULT_TEXT: Record<Question['kind'], [string, string]> = {
  choice: ['Richtig', 'Leider falsch'],
  cloze: ['Richtig', 'Leider falsch'],
  listen: ['Richtig verstanden', 'Leider falsch'],
  truefalse: ['Richtig erkannt', 'Leider daneben'],
};

/** A question with a few answers to tap: multiple choice, gap in a sentence, listening, or true or false. */
export function QuizCard(props: Props) {
  const { q, question, answer, example, note, tag, meaning, result, leaving, onPick, onContinue, speak, speakingKey, speechSupported } = props;
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (result) next.current?.focus({ preventScroll: true });
  }, [result]);

  const speakQuestion = () => speak(question.text, question.lang, 'q');
  // The sentence itself is the question in a gap, so it isn't repeated below.
  const showExample = q.kind !== 'cloze' && example;
  const showAnswer = q.kind === 'truefalse' && !q.isTrue;

  return (
    <div className={`quiz quiz--${q.kind} ${leaving ? 'is-leaving' : ''}`}>
      <div className={`quiz-card ${result ? (result.correct ? 'is-right' : 'is-wrong') : ''}`}>
        <div className="flip-face__top">
          <span className="quiz-card__chips">
            {tag && <span className="chip chip--sm">{tag}</span>}
            {q.fallback && <span className="chip chip--sm">{q.fallback}</span>}
          </span>
          {speechSupported && q.kind !== 'listen' && q.kind !== 'cloze' && (
            <SpeakButton active={speakingKey === 'q'} onSpeak={speakQuestion} label="Frage vorlesen" />
          )}
        </div>

        {q.kind === 'cloze' ? (
          <div className="quiz-card__body">
            <p className="card-meta">Was fehlt im Satz?</p>
            <p className="cloze">
              {q.cloze.before}
              <span className={`cloze__gap ${result ? 'is-filled' : ''}`}>{result ? q.cloze.gap : '      '}</span>
              {q.cloze.after}
            </p>
            {meaning && (
              <p className="cloze__hint">
                <span>Bedeutung</span> {meaning}
              </p>
            )}
            {result && example && speechSupported && (
              <div className="card-a-row">
                <p className="card-meta">Satz anhören</p>
                <SpeakButton small active={speakingKey === 'e'} onSpeak={() => speak(example.text, example.lang, 'e')} label="Satz vorlesen" />
              </div>
            )}
          </div>
        ) : q.kind === 'listen' && !result ? (
          <div className="quiz-card__body quiz-card__body--listen">
            <button type="button" className={`listen-btn ${speakingKey === 'q' ? 'is-active' : ''}`} onClick={speakQuestion} aria-label="Nochmal anhören">
              <Volume2 size={34} />
            </button>
            <p className="card-meta">Was bedeutet das, was du hörst?</p>
          </div>
        ) : (
          <p className={`card-q quiz-card__q ${sizeClass(question.text)}`}>{question.text}</p>
        )}

        {q.kind === 'truefalse' && (
          <div className="quiz-card__claim">
            <p className="card-meta">Stimmt diese Antwort?</p>
            <p className={`card-a ${sizeClass(q.shown)} ${result ? (q.isTrue ? 'is-true' : 'is-false') : ''}`}>{q.shown}</p>
          </div>
        )}

        {result && (showAnswer || showExample || note) && (
          <div className="quiz-card__reveal">
            {showAnswer && (
              <>
                <p className="card-meta">Richtig wäre</p>
                <p className={`card-a ${sizeClass(answer.text)}`}>{answer.text}</p>
              </>
            )}
            {showExample && (
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

      <div className={`quiz-options ${q.kind === 'truefalse' ? 'quiz-options--tf' : ''}`} role="group" aria-label="Antworten">
        {q.options.map((text, i) => {
          const state = !result ? '' : i === q.correct ? 'is-right' : i === result.picked ? 'is-wrong' : 'is-dim';
          const tone = q.kind === 'truefalse' ? (i === 0 ? 'tf-no' : 'tf-yes') : '';
          return (
            <button key={i} type="button" className={`quiz-option ${tone} ${state}`} onClick={() => onPick(i)} disabled={!!result}>
              <kbd className="only-pointer">{q.kind === 'truefalse' ? (i === 0 ? '←' : '→') : i + 1}</kbd>
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
            {RESULT_TEXT[q.kind][result.correct ? 0 : 1]}
          </p>
          <button ref={next} type="button" className="btn btn--primary btn--xl" onClick={onContinue}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
