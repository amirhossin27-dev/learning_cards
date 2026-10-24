import { DeckIcon } from '../lib/deckIcons';
import { href } from '../lib/router';
import type { DeckStats } from '../lib/store';
import type { Deck } from '../types';
import { BoxBar } from './BoxBar';

interface Props {
  deck: Deck;
  stats: DeckStats;
  /** Cards on today's list for this deck (due + new within budget). */
  today: number;
  compact?: boolean;
}

/** A deck as an index card with a coloured tab, like a divider in a card box. */
export function DeckTile({ deck, stats, today, compact }: Props) {
  // New cards beyond today's budget are still worth pointing out, so "erledigt" only means nothing is left at all.
  const status = today > 0 ? `${today} für heute` : stats.fresh > 0 ? `${stats.fresh} neu` : stats.total ? 'erledigt' : 'leer';
  return (
    <a className={`deck-tile ${compact ? 'deck-tile--compact' : ''}`} href={href({ name: 'deck', id: deck.id })} data-marker={deck.color % 6}>
      <i className="tab" aria-hidden="true" />
      <div className="deck-tile__head">
        <strong>{deck.name}</strong>
        {compact ? (
          <span className={`deck-tile__due ${today > 0 ? 'is-due' : ''}`}>{status}</span>
        ) : (
          <span className="deck-tile__icon">
            <DeckIcon name={deck.icon} size={17} />
          </span>
        )}
      </div>
      {!compact && <p>{deck.description}</p>}
      <BoxBar boxes={stats.boxes} />
      {!compact && (
        <div className="deck-tile__foot">
          <span>
            {stats.total} {stats.total === 1 ? 'Karte' : 'Karten'}
          </span>
          <span className={today > 0 ? 'is-due' : ''}>{status}</span>
        </div>
      )}
    </a>
  );
}
