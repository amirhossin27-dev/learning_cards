import { Check, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { clozeFor, fitsCard, suggestWrong, usablePinned } from '../lib/questions';
import { bareTerm, gapWords, METHODS, normalize, PAIR_MAX_LENGTH, sentenceWords, type StudyMethod } from '../lib/quiz';
import { actions, getState, type CardInput } from '../lib/store';
import type { Card } from '../types';
import { Modal } from './Modal';
import { METHOD_ICONS } from './StudyLauncher';
import { toast } from './Toast';

const ALL_METHODS = METHODS.map((m) => m.value);

interface Props {
  deckId: string;
  card?: Card;
  tags: string[];
  onClose: () => void;
}

export function CardEditor({ deckId, card, tags, onClose }: Props) {
  const [form, setForm] = useState<CardInput>({
    front: card?.front ?? '',
    back: card?.back ?? '',
    example: card?.example ?? '',
    note: card?.note ?? '',
    tag: card?.tag ?? '',
  });
  // The gap picked by hand ('' = let the app find the front term in the sentence) and the fixed wrong answers.
  const [gap, setGap] = useState(card?.gap ?? '');
  const [wrong, setWrong] = useState<string[]>(card?.wrong ?? []);
  const [wrongGap, setWrongGap] = useState<string[]>(card?.wrongGap ?? []);
  // Ticked methods; the ones that don't fit the card right now are hidden but keep their tick.
  const [ticked, setTicked] = useState<StudyMethod[]>(card?.methods ?? ALL_METHODS);
  const example = form.example?.trim() ?? '';
  const words = useMemo(() => sentenceWords(example), [example]);
  // A gap picked by hand only counts while the sentence still contains it.
  const ownRange = gap ? gapWords(gap, example) : null;
  const draft = { front: form.front.trim(), back: form.back.trim(), example, gap: ownRange ? gap : undefined };
  const cloze = clozeFor(draft);
  // Where the app would put the gap by itself: the front term, if the sentence has it.
  const auto = clozeFor({ front: draft.front, example });
  const autoRange = auto ? gapWords(auto.gap, example) : null;
  const range = ownRange ?? autoRange;

  /** Tapping next to the gap makes it longer, tapping its first or last word shorter, tapping anywhere else starts a new one. */
  const tapWord = (i: number) => {
    let next: [number, number] | null;
    if (!range) next = [i, i];
    else if (i === range[0] - 1) next = [i, range[1]];
    else if (i === range[1] + 1) next = [range[0], i];
    else if (i === range[0] && i === range[1]) next = null;
    else if (i === range[0]) next = [i + 1, range[1]];
    else if (i === range[1]) next = [range[0], i - 1];
    else next = [i, i];
    // The same words the app finds anyway are not stored as a choice.
    const same = next && autoRange && next[0] === autoRange[0] && next[1] === autoRange[1];
    setGap(next && !same ? example.slice(words[next[0]].start, words[next[1]].end) : '');
  };
  const fitting = ALL_METHODS.filter((m) => fitsCard(draft, m));
  const shown = fitting.filter((m) => ticked.includes(m));
  const valid = form.front.trim() !== '' && form.back.trim() !== '' && shown.length > 0;
  const toggle = (m: StudyMethod) => setTicked((t) => (t.includes(m) ? t.filter((x) => x !== m) : [...t, m]));
  // Everything ticked is stored as "no choice", so methods added later are on for the card too.
  const methods = ALL_METHODS.every((m) => ticked.includes(m)) ? undefined : ALL_METHODS.filter((m) => ticked.includes(m));
  const set = (key: keyof CardInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // What the app would pick by itself, as suggestions to tap. Other cards don't change while the editor is open.
  const gapAnswer = draft.gap ?? bareTerm(draft.front);
  const asksBack = shown.includes('choice') || shown.includes('truefalse');
  const asksGap = shown.includes('cloze');
  const suggestions = useMemo(() => {
    const { cards, decks } = getState();
    const self = { id: card?.id ?? '', deckId, front: draft.front, back: draft.back, example: draft.example, gap: draft.gap, tag: form.tag?.trim() || undefined };
    const others = (kind: 'back' | 'gap', own: string[]) => {
      const taken = new Set(own.map(normalize));
      return suggestWrong(self, kind, { cards, decks }, 3 + own.length)
        .filter((text) => !taken.has(normalize(text)))
        .slice(0, Math.max(0, 3 - own.length));
    };
    return { back: draft.back ? others('back', wrong) : [], gap: cloze ? others('gap', wrongGap) : [] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, deckId, draft.front, draft.back, draft.example, draft.gap, form.tag, wrong, wrongGap]);

  const save = (another: boolean) => {
    if (!valid) return;
    const input: CardInput = {
      ...form,
      methods,
      gap: draft.gap,
      wrong: usablePinned(wrong, draft.back),
      wrongGap: cloze ? usablePinned(wrongGap, gapAnswer) : [],
    };
    if (card) {
      actions.updateCard(card.id, input);
      toast('Karte gespeichert');
    } else {
      actions.addCard(deckId, input);
      toast('Karte hinzugefügt');
    }
    if (another) {
      setForm((f) => ({ front: '', back: '', example: '', note: '', tag: f.tag }));
      setGap('');
      setWrong([]);
      setWrongGap([]);
    } else onClose();
  };

  return (
    <Modal
      title={card ? 'Karte bearbeiten' : 'Neue Karte'}
      onClose={onClose}
      footer={
        <>
          {card && (
            <button
              className="btn btn--ghost btn--danger-text"
              onClick={() => {
                actions.deleteCard(card.id);
                toast('Karte gelöscht');
                onClose();
              }}
            >
              <Trash2 size={16} /> Löschen
            </button>
          )}
          {!card && (
            <button className="btn btn--ghost" disabled={!valid} onClick={() => save(true)}>
              Speichern & weitere
            </button>
          )}
          <button className="btn btn--primary" disabled={!valid} onClick={() => save(false)}>
            Speichern
          </button>
        </>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
      >
        <label className="field">
          <span>Vorderseite (Frage)</span>
          <textarea rows={2} value={form.front} onChange={set('front')} placeholder="z. B. to follow up" />
        </label>
        <label className="field">
          <span>Rückseite (Antwort)</span>
          <textarea rows={2} value={form.back} onChange={set('back')} placeholder="z. B. nachfassen" />
        </label>
        <label className="field">
          <span>
            Beispielsatz <em>optional</em>
          </span>
          <textarea rows={2} value={form.example} onChange={set('example')} placeholder="I'll follow up on this next week." />
        </label>
        {words.length > 0 && (
          <div className="field gap-pick">
            <span>
              Lücke im Satz <em>Wörter antippen</em>
            </span>
            <div className="gap-pick__words" role="group" aria-label="Wörter für die Lücke">
              {words.map((w, i) => {
                const on = !!range && i >= range[0] && i <= range[1];
                return w.start === w.end ? (
                  <span key={i} className="gap-word is-plain">
                    {w.text}
                  </span>
                ) : (
                  <button key={i} type="button" className={`gap-word ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => tapWord(i)}>
                    {w.text}
                  </button>
                );
              })}
            </div>
            <small className="method-picks__hint">
              {ownRange ? (
                <>
                  Deine Lücke.{' '}
                  <button type="button" className="link-btn" onClick={() => setGap('')}>
                    {auto ? 'Wieder automatisch wählen' : 'Lücke entfernen'}
                  </button>
                </>
              ) : range ? (
                'Die App hat das Wort der Vorderseite im Satz gefunden. Tippe andere Wörter an, um die Lücke zu ändern.'
              ) : (
                'Tippe die Wörter an, die im Lückentext fehlen sollen.'
              )}
            </small>
          </div>
        )}
        <label className="field">
          <span>
            Eselsbrücke / Notiz <em>optional</em>
          </span>
          <textarea rows={2} value={form.note} onChange={set('note')} />
        </label>
        <label className="field">
          <span>
            Kategorie <em>optional</em>
          </span>
          <input value={form.tag} onChange={set('tag')} list="tag-options" placeholder="z. B. Meetings" />
          <datalist id="tag-options">
            {tags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <fieldset className="field method-picks">
          <legend>So wird die Karte abgefragt</legend>
          <div className="method-picks__list">
            {METHODS.filter((m) => fitting.includes(m.value)).map(({ value, label }) => {
              const Icon = METHOD_ICONS[value];
              const on = ticked.includes(value);
              // The last ticked method can't be switched off, a card needs at least one.
              const last = on && shown.length === 1;
              return (
                <label key={value} className={`method-pick ${on ? 'is-on' : ''} ${last ? 'is-last' : ''}`}>
                  <input type="checkbox" checked={on} disabled={last} onChange={() => toggle(value)} />
                  <Icon size={16} />
                  <span>{label}</span>
                  <i className="method-pick__box" aria-hidden="true">
                    {on && <Check size={13} strokeWidth={3} />}
                  </i>
                </label>
              );
            })}
          </div>
          {(!fitting.includes('cloze') || !fitting.includes('pairs')) && (
            <small className="method-picks__hint">
              {[
                !fitting.includes('cloze') &&
                  (example ? 'Lückentext gibt es, sobald du im Beispielsatz eine Lücke antippst.' : 'Lückentext gibt es, sobald die Karte einen Beispielsatz hat.'),
                !fitting.includes('pairs') && `Paare gibt es nur für kurze Karten (bis ${PAIR_MAX_LENGTH} Zeichen pro Seite).`,
              ]
                .filter(Boolean)
                .join(' ')}
            </small>
          )}
        </fieldset>
        {(asksBack || asksGap) && draft.back !== '' && (
          <fieldset className="field method-picks wrong-picks">
            <legend>
              Falsche Antworten <em>optional</em>
            </legend>
            {asksBack && (
              <WrongPicker label="Bei Auswahl und Richtig/Falsch" answer={draft.back} own={wrong} suggestions={suggestions.back} onChange={setWrong} />
            )}
            {asksGap && <WrongPicker label="In der Lücke" answer={gapAnswer} own={wrongGap} suggestions={suggestions.gap} onChange={setWrongGap} />}
            <small className="method-picks__hint">
              Gestrichelt sind Vorschläge der App, sie wechseln von Mal zu Mal. Tippe einen an, um ihn festzulegen, oder schreib eigene dazu. Was
              fehlt, füllt die App aus dem Stapel auf.
            </small>
          </fieldset>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

interface WrongPickerProps {
  label: string;
  /** The right answer, which can't be added as a wrong one. */
  answer: string;
  own: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}

/** Fixed wrong answers as chips: the user's own, the app's suggestions to tap, and a field for new ones. */
function WrongPicker({ label, answer, own, suggestions, onChange }: WrongPickerProps) {
  const [text, setText] = useState('');
  const add = (value: string) => {
    const next = usablePinned([...own, value], answer);
    if (next.length === own.length) toast(normalize(value) ? 'Das ist die richtige Antwort oder schon dabei' : 'Schreib erst eine Antwort');
    else onChange(next);
    setText('');
  };
  return (
    <div className="wrong-pick">
      <span className="wrong-pick__label">{label}</span>
      <div className="wrong-pick__chips">
        {own.map((value) => (
          <span key={value} className="wrong-chip is-own">
            {value}
            <button type="button" aria-label={`${value} entfernen`} onClick={() => onChange(own.filter((x) => x !== value))}>
              <X size={13} strokeWidth={2.6} />
            </button>
          </span>
        ))}
        {suggestions.map((value) => (
          <button key={value} type="button" className="wrong-chip is-suggestion" onClick={() => add(value)} aria-label={`${value} festlegen`}>
            <Plus size={13} strokeWidth={2.6} />
            {value}
          </button>
        ))}
      </div>
      <div className="wrong-pick__add">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            // Enter adds the answer instead of saving the whole card.
            e.preventDefault();
            add(text);
          }}
          placeholder="Eigene falsche Antwort"
          aria-label={`Eigene falsche Antwort: ${label}`}
          enterKeyHint="done"
        />
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => add(text)} disabled={text.trim() === ''}>
          <Plus size={15} /> Dazu
        </button>
      </div>
    </div>
  );
}
