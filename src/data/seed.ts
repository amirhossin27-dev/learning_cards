import type { Deck } from '../types';
import { businessEnglishDeck } from './decks/business-english';
import { biasesDeck } from './decks/biases';
import { dockerKubernetesDeck } from './decks/docker-kubernetes';
import { englishGrammarDeck } from './decks/english-grammar';
import { financeDeck } from './decks/finance';
import { geographyDeck } from './decks/geography';
import { historyDeck } from './decks/history';
import { idiomsDeck } from './decks/idioms';
import { myVocabDeck } from './decks/my-vocab';
import { programmingDeck } from './decks/programming';
import { pythonDeck } from './decks/python';
import { spaceDeck } from './decks/space';

export interface SeedCard {
  front: string;
  back: string;
  example?: string;
  note?: string;
  tag?: string;
  /** Set (via `added`) on cards that joined the deck after its first release. */
  added?: string;
}

export type SeedDeck = Omit<Deck, 'createdAt' | 'builtIn'> & {
  cards: SeedCard[];
  /** Earlier descriptions. A stored deck that still shows one of them gets the current text. */
  oldDescriptions?: string[];
};

export const builtInDecks: SeedDeck[] = [
  businessEnglishDeck,
  myVocabDeck,
  geographyDeck,
  programmingDeck,
  historyDeck,
  englishGrammarDeck,
  pythonDeck,
  dockerKubernetesDeck,
  // Decks of the week, oldest first (see decks/README.md).
  biasesDeck,
  spaceDeck,
  financeDeck,
  idiomsDeck,
];
