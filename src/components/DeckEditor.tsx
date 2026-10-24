import { useState } from 'react';
import { DECK_ICONS, DeckIcon, ICON_KEYS, MARKER_NAMES } from '../lib/deckIcons';
import { actions } from '../lib/store';
import { navigate } from '../lib/router';
import type { Deck, Lang } from '../types';
import { Modal } from './Modal';
import { toast } from './Toast';

export const COLOR_COUNT = MARKER_NAMES.length;
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
  const [icon, setIcon] = useState(deck?.icon ?? 'layers');
  const [color, setColor] = useState(deck?.color ?? Math.floor(Math.random() * COLOR_COUNT));
  const [frontLang, setFrontLang] = useState<Lang>(deck?.frontLang.startsWith('en') ? 'en-US' : (deck?.frontLang ?? 'en-US'));
  const [backLang, setBackLang] = useState<Lang>(deck?.backLang.startsWith('en') ? 'en-US' : (deck?.backLang ?? 'de-DE'));

  const save = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), description: description.trim(), icon, color, frontLang, backLang };
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
        <div className="deck-preview" data-marker={color}>
          <i className="tab" aria-hidden="true" />
          <DeckIcon name={icon} size={20} />
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
          <div className="icon-grid">
            {ICON_KEYS.filter((k) => k !== 'inbox' || icon === 'inbox').map((k) => (
              <button
                type="button"
                key={k}
                className={k === icon ? 'is-active' : ''}
                onClick={() => setIcon(k)}
                aria-label={DECK_ICONS[k].label}
                aria-pressed={k === icon}
                title={DECK_ICONS[k].label}
              >
                <DeckIcon name={k} size={20} />
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Marker-Farbe</span>
          <div className="color-grid">
            {MARKER_NAMES.map((label, i) => (
              <button
                type="button"
                key={i}
                data-marker={i}
                className={i === color ? 'is-active' : ''}
                onClick={() => setColor(i)}
                aria-label={label}
                aria-pressed={i === color}
                title={label}
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
