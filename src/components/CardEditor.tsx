import { Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { fitsCard } from '../lib/questions';
import { METHODS, PAIR_MAX_LENGTH, type StudyMethod } from '../lib/quiz';
import { actions, type CardInput } from '../lib/store';
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
  // Ticked methods; the ones that don't fit the card right now are hidden but keep their tick.
  const [ticked, setTicked] = useState<StudyMethod[]>(card?.methods ?? ALL_METHODS);
  const draft = { front: form.front.trim(), back: form.back.trim(), example: form.example?.trim() };
  const fitting = ALL_METHODS.filter((m) => fitsCard(draft, m));
  const shown = fitting.filter((m) => ticked.includes(m));
  const valid = form.front.trim() !== '' && form.back.trim() !== '' && shown.length > 0;
  const toggle = (m: StudyMethod) => setTicked((t) => (t.includes(m) ? t.filter((x) => x !== m) : [...t, m]));
  // Everything ticked is stored as "no choice", so methods added later are on for the card too.
  const methods = ALL_METHODS.every((m) => ticked.includes(m)) ? undefined : ALL_METHODS.filter((m) => ticked.includes(m));
  const set = (key: keyof CardInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = (another: boolean) => {
    if (!valid) return;
    if (card) {
      actions.updateCard(card.id, { ...form, methods });
      toast('Karte gespeichert');
    } else {
      actions.addCard(deckId, { ...form, methods });
      toast('Karte hinzugefügt');
    }
    if (another) setForm((f) => ({ front: '', back: '', example: '', note: '', tag: f.tag }));
    else onClose();
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
                !fitting.includes('cloze') && 'Lückentext gibt es, sobald der Beispielsatz das Wort der Vorderseite enthält.',
                !fitting.includes('pairs') && `Paare gibt es nur für kurze Karten (bis ${PAIR_MAX_LENGTH} Zeichen pro Seite).`,
              ]
                .filter(Boolean)
                .join(' ')}
            </small>
          )}
        </fieldset>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
