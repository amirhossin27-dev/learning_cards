import type { Deck } from '../types';
import { businessEnglishDeck } from './decks/business-english';
import { myVocabDeck } from './decks/my-vocab';
import { geographyDeck, historyDeck, programmingDeck } from './decks/samples';

export interface SeedCard {
  front: string;
  back: string;
  example?: string;
  note?: string;
  tag?: string;
}

export type SeedDeck = Omit<Deck, 'createdAt' | 'builtIn'> & { cards: SeedCard[] };

export const builtInDecks: SeedDeck[] = [businessEnglishDeck, myVocabDeck, geographyDeck, programmingDeck, historyDeck];
