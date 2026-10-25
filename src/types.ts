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
  /** Leitner box ("Fach") 0–4, derived from the review interval. 4 = mastered. */
  box: number;
  /** Days until the next review; 0 while the card is new or being relearned. */
  interval?: number;
  /** Multiplier for the next interval (SM-2 style ease factor). */
  ease?: number;
  /** Timestamp when the card is due again. Undefined for new cards. */
  due?: number;
  reps?: number;
  /** How often a learned card was forgotten again. */
  lapses?: number;
  lastReviewed?: number;
  createdAt: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  /** Key into the deck icon set (see lib/deckIcons). */
  icon: string;
  /** Legacy emoji symbol from version 1, kept so old exports stay readable. */
  emoji?: string;
  /** Index into the marker palette (see styles). */
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
  /** Answers per day that count as reaching the daily goal. */
  dailyGoal: number;
  /** New cards introduced per day across all decks. */
  newPerDay: number;
}

export interface DayLog {
  /** Answers given that day, including extra rounds. */
  reviews: number;
  /** Cards studied for the very first time that day. */
  fresh: number;
}

export interface AppData {
  version: number;
  decks: Deck[];
  cards: Card[];
  settings: Settings;
  /** Built-in deck ids that have been seeded at least once (so deleting one sticks). */
  seeded: string[];
  /**
   * Fronts (lower case) of the built-in cards each built-in deck has received,
   * so cards added in later releases arrive once and deleted ones stay deleted.
   */
  seededCards: Record<string, string[]>;
  /** Study log keyed by local date (YYYY-MM-DD). */
  history: Record<string, DayLog>;
}
