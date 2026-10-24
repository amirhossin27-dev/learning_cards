import { FileUp, Info } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';
import { importCsv, type ImportResult } from '../lib/csv';
import { navigate } from '../lib/router';
import { actions, useAppData } from '../lib/store';
import type { Lang } from '../types';
import { COLOR_COUNT, LANGS } from './DeckEditor';
import { Modal } from './Modal';
import { toast } from './Toast';

interface Props {
  deckId?: string;
  onClose: () => void;
}

const NEW = '__new__';
const normalize = (s: string) => s.trim().toLowerCase();

export function ImportDialog({ deckId, onClose }: Props) {
  const { decks, cards } = useAppData();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState(deckId ?? NEW);
  const [newName, setNewName] = useState('');
  const [frontLang, setFrontLang] = useState<Lang>('en-US');
  const [backLang, setBackLang] = useState<Lang>('de-DE');

  const readFile = async (file: File) => {
    setError('');
    try {
      const parsed = importCsv(await file.text());
      if (parsed.cards.length === 0) {
        setError('In der Datei wurden keine Karten gefunden. Erwartet werden mindestens zwei Spalten: Frage und Antwort.');
        setResult(null);
        return;
      }
      setFileName(file.name);
      setNewName(file.name.replace(/\.(csv|txt)$/i, '').replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase()));
      setResult(parsed);
    } catch {
      setError('Die Datei konnte nicht gelesen werden.');
    }
  };

  const existingFronts = useMemo(
    () => new Set(cards.filter((c) => c.deckId === target).map((c) => normalize(c.front))),
    [cards, target],
  );
  const fresh = useMemo(() => result?.cards.filter((c) => !existingFronts.has(normalize(c.front))) ?? [], [result, existingFronts]);
  const alreadyThere = (result?.cards.length ?? 0) - fresh.length;

  const confirm = () => {
    if (!result || fresh.length === 0) return;
    let id = target;
    if (target === NEW) {
      id = actions.addDeck({
        name: newName.trim() || 'Importierte Karten',
        description: `Importiert aus ${fileName}`,
        emoji: '📥',
        color: Math.floor(Math.random() * COLOR_COUNT),
        frontLang,
        backLang,
      });
    }
    actions.importCards(id, fresh);
    toast(`${fresh.length} Karten importiert`);
    onClose();
    navigate({ name: 'deck', id });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  return (
    <Modal
      title="CSV importieren"
      onClose={onClose}
      wide
      footer={
        result && (
          <>
            <button className="btn btn--ghost" onClick={() => setResult(null)}>
              Andere Datei
            </button>
            <button className="btn btn--primary" onClick={confirm} disabled={fresh.length === 0}>
              {fresh.length} {fresh.length === 1 ? 'Karte' : 'Karten'} importieren
            </button>
          </>
        )
      }
    >
      <input
        ref={input}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
          e.target.value = '';
        }}
      />

      {!result ? (
        <>
          <button
            className={`dropzone ${dragging ? 'is-dragging' : ''}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <FileUp size={36} />
            <strong>CSV-Datei auswählen</strong>
            <span>oder hierher ziehen</span>
          </button>
          {error && <p className="form__error">{error}</p>}
          <div className="info-box">
            <Info size={18} />
            <div>
              <p>
                <strong>Format:</strong> Spalte 1 = Vorderseite, Spalte 2 = Rückseite. Optional: Beispielsatz, Notiz, Kategorie.
              </p>
              <p>
                Kopfzeile, Komma oder Semikolon (Excel) werden automatisch erkannt. Doppelte Einträge in beide Richtungen werden zu einer Karte
                zusammengefasst.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="form">
          <div className="import-summary">
            <div>
              <strong>{result.cards.length}</strong>
              <span>Karten erkannt</span>
            </div>
            {result.reversedSkipped > 0 && (
              <div>
                <strong>{result.reversedSkipped}</strong>
                <span>Umkehr-Duplikate zusammengefasst</span>
              </div>
            )}
            {alreadyThere > 0 && (
              <div>
                <strong>{alreadyThere}</strong>
                <span>schon im Stapel</span>
              </div>
            )}
          </div>

          <div className="preview-table" role="table" aria-label="Vorschau">
            <div className="preview-table__row preview-table__row--head" role="row">
              <span role="columnheader">Vorderseite</span>
              <span role="columnheader">Rückseite</span>
            </div>
            {result.cards.slice(0, 6).map((c, i) => (
              <div className="preview-table__row" role="row" key={i}>
                <span role="cell">{c.front}</span>
                <span role="cell">{c.back}</span>
              </div>
            ))}
            {result.cards.length > 6 && <div className="preview-table__more">… und {result.cards.length - 6} weitere</div>}
          </div>

          <label className="field">
            <span>Importieren in</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value={NEW}>➕ Neuer Stapel</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.name}
                </option>
              ))}
            </select>
          </label>

          {target === NEW && (
            <>
              <label className="field">
                <span>Name des neuen Stapels</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </label>
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
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
