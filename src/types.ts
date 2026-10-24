export type Lang = 'en-US' | 'en-GB' | 'de-DE' | 'fr-FR' | 'es-ES' | 'it-IT';

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  /** Optional example sentence, spoken in the deck's front language. */
  example?: string;
  /** Optional mnemonic / extra note shown on the back. */
  note?: string;
  /** Optional category used for filtering inside a deck. */
  tag?: string;
  /** Leitner box: 0 = new / forgotten, 5 = mastered. */
  box: number;
  lastReviewed?: number;
  createdAt: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Index into the gradient palette (see styles). */
  color: number;
  frontLang: Lang;
  backLang: Lang;
  builtIn?: boolean;
  createdAt: number;
}

export type Direction = 'front' | 'back' | 'mixed';

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  /** Accent used whenever a deck side is English. */
  englishAccent: 'en-US' | 'en-GB';
  speechRate: number;
  autoSpeak: boolean;
  direction: Direction;
  sessionSize: number;
}

export interface AppData {
  version: number;
  decks: Deck[];
  cards: Card[];
  settings: Settings;
  /** Built-in deck ids that have been seeded at least once (so deleting one sticks). */
  seeded: string[];
}
