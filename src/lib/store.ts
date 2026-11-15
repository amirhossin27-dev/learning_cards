import { useSyncExternalStore } from 'react';
import { builtInDecks, type SeedCard, type SeedDeck } from '../data/seed';
import type { AppData, Card, DayLog, Deck, Settings } from '../types';
import { iconFromEmoji } from './deckIcons';
import { uid } from './id';
import { savedMethod, type StudyMethod } from './quiz';
import { addDays, dayKey, isDue, isNew, migrateLegacy, schedule, stageOf, type Rating, type Stage } from './srs';

// The key keeps its v1 name so existing data (and the theme script in index.html) keep working.
const STORAGE_KEY = 'karteikarten:v1';
const VERSION = 2;

export const defaultSettings: Settings = {
  theme: 'system',
  englishAccent: 'en-US',
  speechRate: 0.95,
  autoSpeak: false,
  sounds: 'normal',
  direction: 'front',
  methods: {},
};

function cardFromSeed(deckId: string, seed: SeedCard, now: number): Card {
  const { added: _a, ...fields } = seed;
  return { ...fields, id: uid(), deckId, box: 0, createdAt: now };
}

const cardKey = (front: string) => front.trim().toLowerCase();

function seedDeck(data: AppData, seed: SeedDeck): AppData {
  const now = Date.now();
  const { cards, oldDescriptions: _o, ...deck } = seed;
  return {
    ...data,
    decks: [...data.decks, { ...deck, builtIn: true, createdAt: now }],
    cards: [...data.cards, ...cards.map((c) => cardFromSeed(deck.id, c, now))],
    seeded: [...new Set([...data.seeded, deck.id])],
    seededCards: { ...data.seededCards, [deck.id]: cards.map((c) => cardKey(c.front)) },
  };
}

/** Copies tags, notes and examples the user's card doesn't have yet. */
function fillMissing(card: Card, seed: SeedCard | undefined): Card {
  if (!seed) return card;
  const next = { ...card };
  for (const key of ['example', 'note', 'tag'] as const) {
    if (!next[key] && seed[key]) next[key] = seed[key];
  }
  return next;
}

/**
 * Brings a built-in deck the user already has up to date: cards added in later
 * releases arrive once, cards the user deleted or renamed stay gone.
 */
function syncDeck(data: AppData, seed: SeedDeck): AppData {
  const known = data.seededCards[seed.id];
  // Installs from before this bookkeeping got every card without an `added` date.
  const offered = new Set(known ?? seed.cards.filter((c) => !c.added).map((c) => cardKey(c.front)));
  const inDeck = new Set(data.cards.filter((c) => c.deckId === seed.id).map((c) => cardKey(c.front)));
  const fresh = seed.cards.filter((c) => !offered.has(cardKey(c.front)) && !inDeck.has(cardKey(c.front)));

  let cards = data.cards;
  if (!known) {
    // Once per deck: the first-release cards get the tags and notes added since.
    const bySeed = new Map(seed.cards.map((c) => [cardKey(c.front), c]));
    cards = cards.map((c) => (c.deckId === seed.id ? fillMissing(c, bySeed.get(cardKey(c.front))) : c));
  }
  const now = Date.now();
  return {
    ...data,
    decks: data.decks.map((d) =>
      d.id === seed.id && seed.oldDescriptions?.includes(d.description) ? { ...d, description: seed.description } : d,
    ),
    cards: fresh.length ? [...cards, ...fresh.map((c) => cardFromSeed(seed.id, c, now))] : cards,
    seededCards: { ...data.seededCards, [seed.id]: [...new Set([...offered, ...seed.cards.map((c) => cardKey(c.front))])] },
  };
}

/**
 * Adds built-in decks that have never been seeded (new installs and decks added
 * in later releases) and new cards of the built-in decks the user already has.
 */
export function withBuiltIns(data: AppData, force = false, seeds: SeedDeck[] = builtInDecks): AppData {
  let next = data;
  for (const seed of seeds) {
    if (next.decks.some((d) => d.id === seed.id)) next = syncDeck(next, seed);
    else if (force || !next.seeded.includes(seed.id)) next = seedDeck(next, seed);
  }
  return next;
}

function emptyData(): AppData {
  return { version: VERSION, decks: [], cards: [], settings: { ...defaultSettings }, seeded: [], seededCards: {}, history: {} };
}

/** Brings stored data from older versions up to date. */
export function migrate(raw: Partial<AppData>): AppData {
  const data: AppData = {
    ...emptyData(),
    ...raw,
    settings: { ...defaultSettings, ...raw.settings },
    history: raw.history ?? {},
    seededCards: raw.seededCards ?? {},
  };
  if ((raw.version ?? 1) < 2) {
    data.cards = data.cards.map((c) => ({ ...c, ...migrateLegacy(c) }));
  }
  data.decks = data.decks.map((d) => (d.icon ? d : { ...d, icon: iconFromEmoji(d.emoji) }));
  // "Hören" (and typing before it) were removed; the decks that used them get multiple choice.
  const methods: Record<string, StudyMethod> = {};
  for (const [key, value] of Object.entries(data.settings.methods ?? {})) {
    const method = savedMethod(value);
    if (method) methods[key] = method;
  }
  data.settings.methods = methods;
  // Daily goal, round size and new cards per day are gone: learning just goes on, see `buildStream`.
  for (const key of ['dailyGoal', 'sessionSize', 'newPerDay']) delete (data.settings as unknown as Record<string, unknown>)[key];
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

export type CardInput = Pick<Card, 'front' | 'back'> & Partial<Pick<Card, 'example' | 'note' | 'tag' | 'methods' | 'gap' | 'wrong' | 'wrongGap'>>;

/** Drops empty optional fields so they don't show up as blank sections. */
function clean<T extends object>(input: T): T {
  const out = { ...input } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined || (Array.isArray(out[key]) && out[key].length === 0)) delete out[key];
    else if (typeof out[key] === 'string') {
      out[key] = (out[key] as string).trim();
      if (out[key] === '' && key !== 'front' && key !== 'back') delete out[key];
    }
  }
  return out as T;
}

const NO_PROGRESS = { box: 0, interval: undefined, ease: undefined, due: undefined, reps: undefined, lapses: undefined, lastReviewed: undefined, lastRating: undefined };

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
        const { example: _e, note: _n, tag: _t, methods: _m, gap: _g, wrong: _w, wrongGap: _wg, ...base } = c;
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
   * Applies an answer. When practising difficult cards (`practice`) the
   * schedule stays as it is, so extra practice never pushes cards further into
   * the future, but the answer still counts as studied today.
   */
  reviewCard(id: string, rating: Rating, practice = false) {
    const now = Date.now();
    setState((s) => {
      const card = s.cards.find((c) => c.id === id);
      if (!card) return s;
      return {
        ...s,
        history: logAnswer(s.history, now, !practice && isNew(card)),
        cards: s.cards.map((c) => (c.id === id ? { ...c, ...(practice ? {} : schedule(c, rating, now)), lastRating: rating } : c)),
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
  /** Never studied. */
  fresh: number;
  /** Studied, next review within a week. */
  learning: number;
  /** Next review a week or more away ("sitzt"). */
  solid: number;
  due: number;
}

export function deckStats(cards: Card[], now = Date.now()): DeckStats {
  const stages: Record<Stage, number> = { new: 0, learning: 0, solid: 0 };
  let due = 0;
  for (const c of cards) {
    stages[stageOf(c)]++;
    if (isDue(c, now)) due++;
  }
  return { total: cards.length, fresh: stages.new, learning: stages.learning, solid: stages.solid, due };
}

export interface Plan {
  /** Learned cards due today, most overdue first. */
  due: Card[];
  /** Cards never studied, in deck order. */
  fresh: Card[];
}

/** What there is to learn right now. `deckOrder` decides which deck's new cards come first. */
export function planToday(cards: Card[], deckOrder: string[] = [], now = Date.now()): Plan {
  const due = cards.filter((c) => isDue(c, now)).sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
  const rank = (c: Card) => {
    const i = deckOrder.indexOf(c.deckId);
    return i < 0 ? deckOrder.length : i;
  };
  const fresh = cards.filter(isNew).sort((a, b) => rank(a) - rank(b) || a.createdAt - b.createdAt);
  return { due, fresh };
}

/** While there are cards to repeat, about every fourth card is a new one. */
export const NEW_EVERY = 4;

/**
 * The cards for "Weiterlernen", one after the other with no round and no
 * daily number: what is due in random order, a new card mixed in after every
 * three of them, and once nothing is due any more the remaining new cards.
 * Whoever learns more gets more new cards.
 */
export function buildStream(plan: Plan, mix: <T>(items: T[]) => T[] = shuffle): Card[] {
  const out: Card[] = [];
  let next = 0;
  mix(plan.due).forEach((card, i) => {
    out.push(card);
    if ((i + 1) % (NEW_EVERY - 1) === 0 && next < plan.fresh.length) out.push(plan.fresh[next++]);
  });
  return [...out, ...plan.fresh.slice(next)];
}

/** How far ahead a card answered wrong comes back, and one that was only just known. */
export const REPEAT_SOON = 3;
export const REPEAT_LATER = 8;

/** Puts cards back into the queue a few places after the current one (at the end when it is shorter). */
export function requeue<T>(queue: T[], index: number, items: T[], gap: number): T[] {
  const at = Math.min(queue.length, index + 1 + gap);
  return [...queue.slice(0, at), ...items, ...queue.slice(at)];
}

/** How many cards a round of difficult cards holds at most. */
export const HARD_ROUND = 20;

/**
 * Cards worth extra practice: answered wrong last time, or forgotten after
 * they were learned. Wrong last time comes first, then the most forgotten.
 */
export function hardCards(cards: Card[]): Card[] {
  return cards
    .filter((c) => !isNew(c) && (c.lastRating === 1 || (c.lapses ?? 0) > 0))
    .sort(
      (a, b) =>
        Number(b.lastRating === 1) - Number(a.lastRating === 1) ||
        (b.lapses ?? 0) - (a.lapses ?? 0) ||
        (a.ease ?? 2.5) - (b.ease ?? 2.5),
    );
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
