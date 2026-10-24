import { useSyncExternalStore } from 'react';
import { builtInDecks, type SeedCard, type SeedDeck } from '../data/seed';
import type { AppData, Card, DayLog, Deck, Settings } from '../types';
import { iconFromEmoji } from './deckIcons';
import { uid } from './id';
import {
  addDays,
  BOX_COUNT,
  dayKey,
  isDue,
  isNew,
  MASTERED_BOX,
  migrateLegacy,
  schedule,
  type Rating,
} from './srs';

// The key keeps its v1 name so existing data (and the theme script in index.html) keep working.
const STORAGE_KEY = 'karteikarten:v1';
const VERSION = 2;

export const defaultSettings: Settings = {
  theme: 'system',
  englishAccent: 'en-US',
  speechRate: 0.95,
  autoSpeak: false,
  direction: 'front',
  sessionSize: 20,
  dailyGoal: 20,
  newPerDay: 20,
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
  return { version: VERSION, decks: [], cards: [], settings: { ...defaultSettings }, seeded: [], history: {} };
}

/** Brings stored data from older versions up to date. */
export function migrate(raw: Partial<AppData>): AppData {
  const data: AppData = {
    ...emptyData(),
    ...raw,
    settings: { ...defaultSettings, ...raw.settings },
    history: raw.history ?? {},
  };
  if ((raw.version ?? 1) < 2) {
    data.cards = data.cards.map((c) => ({ ...c, ...migrateLegacy(c) }));
  }
  data.decks = data.decks.map((d) => (d.icon ? d : { ...d, icon: iconFromEmoji(d.emoji) }));
  data.version = VERSION;
  return data;
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return withBuiltIns(migrate(JSON.parse(raw) as Partial<AppData>));
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

const NO_PROGRESS = { box: 0, interval: undefined, ease: undefined, due: undefined, reps: undefined, lapses: undefined, lastReviewed: undefined };

/** Records one answer in the study log. */
export function logAnswer(history: Record<string, DayLog>, now: number, firstTime: boolean): Record<string, DayLog> {
  const key = dayKey(now);
  const day = history[key] ?? { reviews: 0, fresh: 0 };
  return { ...history, [key]: { reviews: day.reviews + 1, fresh: day.fresh + (firstTime ? 1 : 0) } };
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

  /**
   * Applies an answer. In an extra round (`practice`) the schedule stays as it
   * is, so studying ahead never pushes cards further into the future, but the
   * answer still counts towards the daily goal.
   */
  reviewCard(id: string, rating: Rating, practice = false) {
    const now = Date.now();
    setState((s) => {
      const card = s.cards.find((c) => c.id === id);
      if (!card) return s;
      return {
        ...s,
        history: logAnswer(s.history, now, !practice && isNew(card)),
        cards: practice ? s.cards : s.cards.map((c) => (c.id === id ? { ...c, ...schedule(c, rating, now) } : c)),
      };
    });
  },

  resetProgress(deckId: string) {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.deckId === deckId ? { ...c, ...NO_PROGRESS } : c)),
    }));
  },

  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },

  restoreBuiltIns() {
    setState((s) => withBuiltIns(s, true));
  },
};

// --- Derived data ------------------------------------------------------------

export interface DeckStats {
  total: number;
  fresh: number;
  due: number;
  mastered: number;
  /** Cards per box ("Fach"); new cards count as box 1. */
  boxes: number[];
  /** 0–1, weighted by box so partial progress counts. */
  progress: number;
}

export function deckStats(cards: Card[], now = Date.now()): DeckStats {
  const boxes = Array<number>(BOX_COUNT).fill(0);
  let fresh = 0;
  let due = 0;
  let weight = 0;
  for (const c of cards) {
    const box = Math.max(0, Math.min(MASTERED_BOX, c.box));
    boxes[box]++;
    weight += box;
    if (isNew(c)) fresh++;
    else if (isDue(c, now)) due++;
  }
  const total = cards.length;
  return { total, fresh, due, mastered: boxes[MASTERED_BOX], boxes, progress: total ? weight / (total * MASTERED_BOX) : 0 };
}

export function newCardsLeft(data: Pick<AppData, 'history' | 'settings'>, now = Date.now()): number {
  return Math.max(0, data.settings.newPerDay - (data.history[dayKey(now)]?.fresh ?? 0));
}

export interface Plan {
  /** Learned cards due today, most overdue first. */
  due: Card[];
  /** New cards within today's budget, in deck order. */
  fresh: Card[];
}

/** What is on today's list for the given cards. `deckOrder` decides which deck's new cards come first. */
export function planToday(cards: Card[], newBudget: number, deckOrder: string[] = [], now = Date.now()): Plan {
  const due = cards.filter((c) => isDue(c, now)).sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
  const rank = (c: Card) => {
    const i = deckOrder.indexOf(c.deckId);
    return i < 0 ? deckOrder.length : i;
  };
  const fresh = cards
    .filter(isNew)
    .sort((a, b) => rank(a) - rank(b) || a.createdAt - b.createdAt)
    .slice(0, newBudget);
  return { due, fresh };
}

/** Today's round: due cards first, then new ones mixed in, capped at `size` (0 = all). */
export function buildSession(plan: Plan, size: number): Card[] {
  const queue = [...plan.due, ...plan.fresh];
  return size > 0 ? queue.slice(0, size) : queue;
}

/**
 * Extra round when nothing is due: weakest boxes first, then the cards not
 * seen for the longest time, shuffled so equal cards vary.
 */
export function buildPractice(cards: Card[], size: number): Card[] {
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

/** Days in a row with at least one answer. Today still counts as "open", so a streak survives until midnight. */
export function streak(history: Record<string, DayLog>, now = Date.now()): number {
  let day = history[dayKey(now)]?.reviews ? now : addDays(now, -1);
  let count = 0;
  while (history[dayKey(day)]?.reviews) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function reviewsOn(history: Record<string, DayLog>, t: number): number {
  return history[dayKey(t)]?.reviews ?? 0;
}

/** Rough duration of a round, assuming about 10 seconds per card. */
export function minutesFor(cards: number): number {
  return Math.max(1, Math.round((cards * 10) / 60));
}
