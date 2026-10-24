import { describe, expect, it } from 'vitest';
import { businessEnglishDeck } from './decks/business-english';
import { myVocabDeck } from './decks/my-vocab';
import { builtInDecks } from './seed';

describe('built-in decks', () => {
  it('ships exactly 100 Business English cards', () => {
    expect(businessEnglishDeck.cards).toHaveLength(100);
  });

  it('has unique deck ids and no duplicate fronts within a deck', () => {
    expect(new Set(builtInDecks.map((d) => d.id)).size).toBe(builtInDecks.length);
    for (const deck of builtInDecks) {
      const fronts = deck.cards.map((c) => c.front.toLowerCase());
      expect(new Set(fronts).size, deck.id).toBe(fronts.length);
    }
  });

  it('gives every card text on both sides', () => {
    for (const deck of [businessEnglishDeck, myVocabDeck]) {
      for (const c of deck.cards) {
        expect(c.front.trim(), deck.id).not.toBe('');
        expect(c.back.trim(), c.front).not.toBe('');
      }
    }
  });
});
