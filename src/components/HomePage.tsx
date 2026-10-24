import { Flame, Layers, Play, Plus, Trophy, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { href } from '../lib/router';
import { deckStats, useAppData } from '../lib/store';
import type { Card, Deck } from '../types';
import { DeckEditor } from './DeckEditor';
import { ImportDialog } from './ImportDialog';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Noch wach?';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Hallo';
  if (h < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

function reviewedToday(cards: Card[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return cards.filter((c) => (c.lastReviewed ?? 0) >= start.getTime()).length;
}

function DeckTile({ deck, cards }: { deck: Deck; cards: Card[] }) {
  const stats = deckStats(cards);
  return (
    <article className="deck-tile">
      <a className="deck-tile__link" href={href({ name: 'deck', id: deck.id })} aria-label={deck.name} />
      <div className={`deck-tile__cover grad-${deck.color}`}>
        <span className="deck-tile__emoji">{deck.emoji}</span>
        <span className="deck-tile__count">{stats.total} Karten</span>
      </div>
      <div className="deck-tile__body">
        <h3>{deck.name}</h3>
        <p>{deck.description}</p>
        <div className="deck-tile__footer">
          <div className="mini-progress" title={`${stats.mastered} von ${stats.total} gemeistert`}>
            <div className="mini-progress__bar">
              <div className={`mini-progress__fill grad-${deck.color}`} style={{ width: `${stats.progress * 100}%` }} />
            </div>
            <span>{Math.round(stats.progress * 100)}%</span>
          </div>
          {stats.total > 0 && (
            <a className="play-btn" href={href({ name: 'study', id: deck.id })} aria-label={`${deck.name} lernen`}>
              <Play size={18} fill="currentColor" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function HomePage() {
  const { decks, cards } = useAppData();
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);

  const byDeck = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of cards) map.set(c.deckId, [...(map.get(c.deckId) ?? []), c]);
    return map;
  }, [cards]);

  const total = deckStats(cards);
  const today = reviewedToday(cards);
  const lastDeck = useMemo(() => {
    let best: Card | undefined;
    for (const c of cards) if ((c.lastReviewed ?? 0) > (best?.lastReviewed ?? 0)) best = c;
    return best ? decks.find((d) => d.id === best.deckId) : undefined;
  }, [cards, decks]);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="hero__eyebrow">{greeting()} 👋</p>
          <h1>
            Bereit für eine <span className="text-gradient">Runde Lernen?</span>
          </h1>
        </div>
        <div className="stat-row">
          <div className="stat-card">
            <Layers size={18} />
            <strong>{total.total}</strong>
            <span>Karten</span>
          </div>
          <div className="stat-card">
            <Trophy size={18} />
            <strong>{total.mastered}</strong>
            <span>gemeistert</span>
          </div>
          <div className="stat-card">
            <Flame size={18} />
            <strong>{today}</strong>
            <span>heute gelernt</span>
          </div>
        </div>
      </section>

      {lastDeck && (
        <a className={`continue-card grad-${lastDeck.color}`} href={href({ name: 'study', id: lastDeck.id })}>
          <span className="continue-card__emoji">{lastDeck.emoji}</span>
          <div>
            <small>Weiterlernen</small>
            <strong>{lastDeck.name}</strong>
          </div>
          <span className="continue-card__play">
            <Play size={20} fill="currentColor" />
          </span>
        </a>
      )}

      <section>
        <div className="section-head">
          <h2>Deine Stapel</h2>
          <div className="section-head__actions">
            <button className="btn btn--ghost btn--sm" onClick={() => setImporting(true)}>
              <Upload size={16} /> CSV importieren
            </button>
          </div>
        </div>
        <div className="deck-grid">
          {decks.map((d) => (
            <DeckTile key={d.id} deck={d} cards={byDeck.get(d.id) ?? []} />
          ))}
          <button className="deck-tile deck-tile--new" onClick={() => setEditing(true)}>
            <Plus size={28} />
            <span>Neuer Stapel</span>
          </button>
        </div>
      </section>

      {editing && <DeckEditor onClose={() => setEditing(false)} />}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </div>
  );
}
