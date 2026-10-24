import { useState } from 'react';
import { actions } from '../lib/store';
import { navigate } from '../lib/router';
import type { Deck, Lang } from '../types';
import { Modal } from './Modal';
import { toast } from './Toast';

export const EMOJIS = ['📚', '💼', '🌍', '💻', '🏛️', '🧪', '🧠', '🎯', '🗣️', '📒', '⚖️', '💡', '🚀', '🎨', '🩺', '🎵'];
export const COLOR_COUNT = 6;
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'en-US', label: 'Englisch' },
  { value: 'fr-FR', label: 'Französisch' },
  { value: 'es-ES', label: 'Spanisch' },
  { value: 'it-IT', label: 'Italienisch' },
];

interface Props {
  deck?: Deck;
  onClose: () => void;
}

export function DeckEditor({ deck, onClose }: Props) {
  const [name, setName] = useState(deck?.name ?? '');
  const [description, setDescription] = useState(deck?.description ?? '');
  const [emoji, setEmoji] = useState(deck?.emoji ?? '📚');
  const [color, setColor] = useState(deck?.color ?? Math.floor(Math.random() * COLOR_COUNT));
  const [frontLang, setFrontLang] = useState<Lang>(deck?.frontLang.startsWith('en') ? 'en-US' : (deck?.frontLang ?? 'en-US'));
  const [backLang, setBackLang] = useState<Lang>(deck?.backLang.startsWith('en') ? 'en-US' : (deck?.backLang ?? 'de-DE'));

  const save = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), description: description.trim(), emoji, color, frontLang, backLang };
    if (deck) {
      actions.updateDeck(deck.id, data);
      toast('Stapel gespeichert');
      onClose();
    } else {
      const id = actions.addDeck(data);
      toast('Stapel erstellt');
      onClose();
      navigate({ name: 'deck', id });
    }
  };

  return (
    <Modal
      title={deck ? 'Stapel bearbeiten' : 'Neuer Stapel'}
      onClose={onClose}
      footer={
        <button className="btn btn--primary" disabled={!name.trim()} onClick={save}>
          {deck ? 'Speichern' : 'Erstellen'}
        </button>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className={`deck-preview grad-${color}`}>
          <span className="deck-preview__emoji">{emoji}</span>
          <strong>{name || 'Mein Stapel'}</strong>
        </div>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Spanisch Urlaub" />
        </label>
        <label className="field">
          <span>
            Beschreibung <em>optional</em>
          </span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="field">
          <span>Symbol</span>
          <div className="emoji-grid">
            {EMOJIS.map((e) => (
              <button type="button" key={e} className={e === emoji ? 'is-active' : ''} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Farbe</span>
          <div className="color-grid">
            {Array.from({ length: COLOR_COUNT }, (_, i) => (
              <button
                type="button"
                key={i}
                className={`grad-${i} ${i === color ? 'is-active' : ''}`}
                onClick={() => setColor(i)}
                aria-label={`Farbe ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Sprache Vorderseite</span>
            <select value={frontLang} onChange={(e) => setFrontLang(e.target.value as Lang)}>
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Sprache Rückseite</span>
            <select value={backLang} onChange={(e) => setBackLang(e.target.value as Lang)}>
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="form__hint">Die Sprache bestimmt, mit welcher Stimme die Karten vorgelesen werden.</p>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
