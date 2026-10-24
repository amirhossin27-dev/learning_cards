import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { actions, type CardInput } from '../lib/store';
import type { Card } from '../types';
import { Modal } from './Modal';
import { toast } from './Toast';

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
  const valid = form.front.trim() !== '' && form.back.trim() !== '';
  const set = (key: keyof CardInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = (another: boolean) => {
    if (!valid) return;
    if (card) {
      actions.updateCard(card.id, form);
      toast('Karte gespeichert');
    } else {
      actions.addCard(deckId, form);
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
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
