import { describe, expect, it } from 'vitest';
import { ICON_KEYS } from '../lib/deckIcons';
import { businessEnglishDeck } from './decks/business-english';
import { geographyDeck } from './decks/geography';
import { builtInDecks } from './seed';

describe('built-in decks', () => {
  it('ships the 100 Business English cards of the first release plus the weekly ones', () => {
    expect(businessEnglishDeck.cards.filter((c) => !c.added)).toHaveLength(100);
    expect(businessEnglishDeck.cards.length).toBeGreaterThanOrEqual(120);
  });

  it('has a capital for every UN member state', () => {
    expect(geographyDeck.cards).toHaveLength(193);
  });

  it('has unique deck ids and no duplicate fronts within a deck', () => {
    expect(new Set(builtInDecks.map((d) => d.id)).size).toBe(builtInDecks.length);
    for (const deck of builtInDecks) {
      const fronts = deck.cards.map((c) => c.front.trim().toLowerCase());
      const dupes = fronts.filter((f, i) => fronts.indexOf(f) !== i);
      expect(dupes, deck.id).toEqual([]);
    }
  });

  it('gives every card text on both sides and no stray whitespace', () => {
    for (const deck of builtInDecks) {
      for (const c of deck.cards) {
        expect(c.front.trim(), deck.id).not.toBe('');
        expect(c.back.trim(), c.front).not.toBe('');
        for (const text of [c.front, c.back, c.example, c.note, c.tag]) {
          if (text !== undefined) expect(text, c.front).toBe(text.trim().replace(/ {2,}/g, ' '));
        }
      }
    }
  });

  it('uses known icons and colours and dates added cards', () => {
    for (const deck of builtInDecks) {
      expect(ICON_KEYS, deck.id).toContain(deck.icon);
      expect(deck.color, deck.id).toBeGreaterThanOrEqual(0);
      expect(deck.color, deck.id).toBeLessThanOrEqual(5);
      for (const c of deck.cards) if (c.added) expect(c.added, c.front).toMatch(/^20\d\d-[01]\d-[0-3]\d$/);
    }
  });
});
