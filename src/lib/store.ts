import { useSyncExternalStore } from 'react';
import { builtInDecks, type SeedCard, type SeedDeck } from '../data/seed';
import type { AppData, Card, Deck, Settings } from '../types';
import { uid } from './id';

const STORAGE_KEY = 'karteikarten:v1';
const VERSION = 1;
export const MASTERED_BOX = 4;
export const MAX_BOX = 5;

export const defaultSettings: Settings = {
  theme: 'system',
  englishAccent: 'en-US',
  speechRate: 0.95,
  autoSpeak: false,
  direction: 'front',
  sessionSize: 20,
};

function cardFromSeed(deckId: string, seed: SeedCard, now: number): Card {
  return { ...seed, id: uid(), deckId, box: 0, createdAt: now };
}

function seedDeck(data: AppData, seed: SeedDeck): AppData {
  const now = Date.now();
  const { cards, ...deck } = seed;
  return {
    ...data,
    decks: [...data.decks, { ...deck, builtIn: true, createdAt: now }],
    cards: [...data.cards, ...cards.map((c) => cardFromSeed(deck.id, c, now))],
    seeded: [...new Set([...data.seeded, deck.id])],
  };
}

/** Adds built-in decks that have never been seeded (new installs and decks added in later releases). */
export function withBuiltIns(data: AppData, force = false): AppData {
  let next = data;
  for (const seed of builtInDecks) {
    const present = next.decks.some((d) => d.id === seed.id);
    if (!present && (force || !next.seeded.includes(seed.id))) next = seedDeck(next, seed);
  }
  return next;
}

function emptyData(): AppData {
  return { version: VERSION, decks: [], cards: [], settings: { ...defaultSettings }, seeded: [] };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return withBuiltIns({ ...emptyData(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } });
    }
  } catch {
    // Corrupt or unavailable storage: start fresh rather than crash.
  }
  return withBuiltIns(emptyData());
}

let state: AppData = load();
const listeners = new Set<() => void>();

function setState(updater: (s: AppData) => AppData) {
  state = updater(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, () => state);
}

export function getState(): AppData {
  return state;
}

export type CardInput = Pick<Card, 'front' | 'back'> & Partial<Pick<Card, 'example' | 'note' | 'tag'>>;

/** Drops empty optional fields so they don't show up as blank sections. */
function clean<T extends object>(input: T): T {
  const out = { ...input } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (typeof out[key] === 'string') {
      out[key] = (out[key] as string).trim();
      if (out[key] === '' && key !== 'front' && key !== 'back') delete out[key];
    }
  }
  return out as T;
}

export const actions = {
  addDeck(input: Omit<Deck, 'id' | 'createdAt'>): string {
    const id = uid();
    setState((s) => ({ ...s, decks: [...s.decks, { ...input, id, createdAt: Date.now() }] }));
    return id;
  },

  updateDeck(id: string, patch: Partial<Omit<Deck, 'id'>>) {
    setState((s) => ({ ...s, decks: s.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  },

  deleteDeck(id: string) {
    setState((s) => ({ ...s, decks: s.decks.filter((d) => d.id !== id), cards: s.cards.filter((c) => c.deckId !== id) }));
  },

  addCard(deckId: string, input: CardInput): string {
    const id = uid();
    setState((s) => ({ ...s, cards: [...s.cards, { ...clean(input), id, deckId, box: 0, createdAt: Date.now() }] }));
    return id;
  },

  updateCard(id: string, input: CardInput) {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) => {
        if (c.id !== id) return c;
        const { example: _e, note: _n, tag: _t, ...base } = c;
        return { ...base, ...clean(input) };
      }),
    }));
  },

  deleteCard(id: string) {
    setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));
  },

  importCards(deckId: string, inputs: CardInput[]): number {
    const now = Date.now();
    setState((s) => ({
      ...s,
      cards: [...s.cards, ...inputs.map((input) => ({ ...clean(input), id: uid(), deckId, box: 0, createdAt: now }))],
    }));
    return inputs.length;
  },

  reviewCard(id: string, correct: boolean) {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) =>
        c.id === id ? { ...c, box: correct ? Math.min(MAX_BOX, c.box + 1) : 0, lastReviewed: Date.now() } : c,
      ),
    }));
  },

  resetProgress(deckId: string) {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.deckId === deckId ? { ...c, box: 0, lastReviewed: undefined } : c)),
    }));
  },

  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },

  restoreBuiltIns() {
    setState((s) => withBuiltIns(s, true));
  },
};

export interface DeckStats {
  total: number;
  fresh: number;
  learning: number;
  mastered: number;
  /** 0–1, weighted by Leitner box so partial progress counts. */
  progress: number;
}

export function deckStats(cards: Card[]): DeckStats {
  let fresh = 0;
  let learning = 0;
  let mastered = 0;
  let boxes = 0;
  for (const c of cards) {
    if (c.box >= MASTERED_BOX) mastered++;
    else if (c.lastReviewed === undefined) fresh++;
    else learning++;
    boxes += Math.min(c.box, MASTERED_BOX);
  }
  const total = cards.length;
  return { total, fresh, learning, mastered, progress: total ? boxes / (total * MASTERED_BOX) : 0 };
}

/**
 * Picks the cards for a study session: lowest Leitner box first, then the
 * ones not seen for the longest time, with a shuffle so equal cards vary.
 */
export function buildSession(cards: Card[], size: number): Card[] {
  const shuffled = shuffle(cards);
  shuffled.sort((a, b) => a.box - b.box || (a.lastReviewed ?? 0) - (b.lastReviewed ?? 0));
  return size > 0 ? shuffled.slice(0, size) : shuffled;
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
