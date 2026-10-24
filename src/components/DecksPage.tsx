import { Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToday } from '../hooks/useToday';
import { deckStats, useAppData } from '../lib/store';
import type { Card } from '../types';
import { DeckEditor } from './DeckEditor';
import { DeckTile } from './DeckTile';
import { ImportDialog } from './ImportDialog';

export function DecksPage() {
  const { decks, cards } = useAppData();
  const { now, plan } = useToday();
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);

  const byDeck = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of cards) map.set(c.deckId, [...(map.get(c.deckId) ?? []), c]);
    return map;
  }, [cards]);

  const todayByDeck = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of [...plan.due, ...plan.fresh]) map.set(c.deckId, (map.get(c.deckId) ?? 0) + 1);
    return map;
  }, [plan]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Stapel</h1>
          <p className="muted">
            {decks.length} Stapel · {cards.length} Karten
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--secondary" onClick={() => setImporting(true)}>
            <Upload size={17} /> CSV importieren
          </button>
          <button className="btn btn--primary" onClick={() => setEditing(true)}>
            <Plus size={17} /> Neuer Stapel
          </button>
        </div>
      </header>

      <div className="deck-grid">
        {decks.map((d) => (
          <DeckTile key={d.id} deck={d} stats={deckStats(byDeck.get(d.id) ?? [], now)} today={todayByDeck.get(d.id) ?? 0} />
        ))}
        <button className="deck-tile deck-tile--new" onClick={() => setEditing(true)}>
          <Plus size={20} />
          <span>Neuer Stapel</span>
        </button>
      </div>

      {editing && <DeckEditor onClose={() => setEditing(false)} />}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </div>
  );
}
