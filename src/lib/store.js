import { useSyncExternalStore } from 'react';
import { builtInDecks } from '../data/seed';
import { iconFromEmoji } from './deckIcons';
import { uid } from './id';
import { addDays, BOX_COUNT, dayKey, isDue, isNew, MASTERED_BOX, migrateLegacy, schedule, } from './srs';
// The key keeps its v1 name so existing data (and the theme script in index.html) keep working.
const STORAGE_KEY = 'karteikarten:v1';
const VERSION = 2;
export const defaultSettings = {
    theme: 'system',
    englishAccent: 'en-US',
    speechRate: 0.95,
    autoSpeak: false,
    direction: 'front',
    sessionSize: 20,
    dailyGoal: 20,
    newPerDay: 20,
    methods: {},
};
function cardFromSeed(deckId, seed, now) {
    const { added: _a, ...fields } = seed;
    return { ...fields, id: uid(), deckId, box: 0, createdAt: now };
}
const cardKey = (front) => front.trim().toLowerCase();
function seedDeck(data, seed) {
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
function fillMissing(card, seed) {
    if (!seed)
        return card;
    const next = { ...card };
    for (const key of ['example', 'note', 'tag']) {
        if (!next[key] && seed[key])
            next[key] = seed[key];
    }
    return next;
}
/**
 * Brings a built-in deck the user already has up to date: cards added in later
 * releases arrive once, cards the user deleted or renamed stay gone.
 */
function syncDeck(data, seed) {
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
        decks: data.decks.map((d) => d.id === seed.id && seed.oldDescriptions?.includes(d.description) ? { ...d, description: seed.description } : d),
        cards: fresh.length ? [...cards, ...fresh.map((c) => cardFromSeed(seed.id, c, now))] : cards,
        seededCards: { ...data.seededCards, [seed.id]: [...new Set([...offered, ...seed.cards.map((c) => cardKey(c.front))])] },
    };
}
/**
 * Adds built-in decks that have never been seeded (new installs and decks added
 * in later releases) and new cards of the built-in decks the user already has.
 */
export function withBuiltIns(data, force = false, seeds = builtInDecks) {
    let next = data;
    for (const seed of seeds) {
        if (next.decks.some((d) => d.id === seed.id))
            next = syncDeck(next, seed);
        else if (force || !next.seeded.includes(seed.id))
            next = seedDeck(next, seed);
    }
    return next;
}
function emptyData() {
    return { version: VERSION, decks: [], cards: [], settings: { ...defaultSettings }, seeded: [], seededCards: {}, history: {} };
}
/** Brings stored data from older versions up to date. */
export function migrate(raw) {
    const data = {
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
    data.version = VERSION;
    return data;
}
function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw)
            return withBuiltIns(migrate(JSON.parse(raw)));
    }
    catch {
        // Corrupt or unavailable storage: start fresh rather than crash.
    }
    return withBuiltIns(emptyData());
}
let state = load();
const listeners = new Set();
function setState(updater) {
    state = updater(state);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    catch {
        // Storage full or blocked (private mode): keep working in memory.
    }
    listeners.forEach((l) => l());
}
function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
export function useAppData() {
    return useSyncExternalStore(subscribe, () => state);
}
export function getState() {
    return state;
}
/** Drops empty optional fields so they don't show up as blank sections. */
function clean(input) {
    const out = { ...input };
    for (const key of Object.keys(out)) {
        if (typeof out[key] === 'string') {
            out[key] = out[key].trim();
            if (out[key] === '' && key !== 'front' && key !== 'back')
                delete out[key];
        }
    }
    return out;
}
const NO_PROGRESS = { box: 0, interval: undefined, ease: undefined, due: undefined, reps: undefined, lapses: undefined, lastReviewed: undefined, lastRating: undefined };
/** Records one answer in the study log. */
export function logAnswer(history, now, firstTime) {
    const key = dayKey(now);
    const day = history[key] ?? { reviews: 0, fresh: 0 };
    return { ...history, [key]: { reviews: day.reviews + 1, fresh: day.fresh + (firstTime ? 1 : 0) } };
}
export const actions = {
    addDeck(input) {
        const id = uid();
        setState((s) => ({ ...s, decks: [...s.decks, { ...input, id, createdAt: Date.now() }] }));
        return id;
    },
    updateDeck(id, patch) {
        setState((s) => ({ ...s, decks: s.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    },
    deleteDeck(id) {
        setState((s) => ({ ...s, decks: s.decks.filter((d) => d.id !== id), cards: s.cards.filter((c) => c.deckId !== id) }));
    },
    addCard(deckId, input) {
        const id = uid();
        setState((s) => ({ ...s, cards: [...s.cards, { ...clean(input), id, deckId, box: 0, createdAt: Date.now() }] }));
        return id;
    },
    updateCard(id, input) {
        setState((s) => ({
            ...s,
            cards: s.cards.map((c) => {
                if (c.id !== id)
                    return c;
                const { example: _e, note: _n, tag: _t, ...base } = c;
                return { ...base, ...clean(input) };
            }),
        }));
    },
    deleteCard(id) {
        setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));
    },
    importCards(deckId, inputs) {
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
    reviewCard(id, rating, practice = false) {
        const now = Date.now();
        setState((s) => {
            const card = s.cards.find((c) => c.id === id);
            if (!card)
                return s;
            return {
                ...s,
                history: logAnswer(s.history, now, !practice && isNew(card)),
                cards: s.cards.map((c) => (c.id === id ? { ...c, ...(practice ? {} : schedule(c, rating, now)), lastRating: rating } : c)),
            };
        });
    },
    resetProgress(deckId) {
        setState((s) => ({
            ...s,
            cards: s.cards.map((c) => (c.deckId === deckId ? { ...c, ...NO_PROGRESS } : c)),
        }));
    },
    updateSettings(patch) {
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },
    restoreBuiltIns() {
        setState((s) => withBuiltIns(s, true));
    },
};
export function deckStats(cards, now = Date.now()) {
    const boxes = Array(BOX_COUNT).fill(0);
    let fresh = 0;
    let due = 0;
    let weight = 0;
    for (const c of cards) {
        const box = Math.max(0, Math.min(MASTERED_BOX, c.box));
        boxes[box]++;
        weight += box;
        if (isNew(c))
            fresh++;
        else if (isDue(c, now))
            due++;
    }
    const total = cards.length;
    return { total, fresh, due, mastered: boxes[MASTERED_BOX], boxes, progress: total ? weight / (total * MASTERED_BOX) : 0 };
}
export function newCardsLeft(data, now = Date.now()) {
    return Math.max(0, data.settings.newPerDay - (data.history[dayKey(now)]?.fresh ?? 0));
}
/** What is on today's list for the given cards. `deckOrder` decides which deck's new cards come first. */
export function planToday(cards, newBudget, deckOrder = [], now = Date.now()) {
    const due = cards.filter((c) => isDue(c, now)).sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
    const rank = (c) => {
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
export function buildSession(plan, size) {
    const queue = [...plan.due, ...plan.fresh];
    return size > 0 ? queue.slice(0, size) : queue;
}
/**
 * Extra round when nothing is due: weakest boxes first, then the cards not
 * seen for the longest time, shuffled so equal cards vary.
 */
export function buildPractice(cards, size) {
    const shuffled = shuffle(cards);
    shuffled.sort((a, b) => a.box - b.box || (a.lastReviewed ?? 0) - (b.lastReviewed ?? 0));
    return size > 0 ? shuffled.slice(0, size) : shuffled;
}
/** How many cards a round of difficult cards holds at most. */
export const HARD_ROUND = 20;
/**
 * Cards worth extra practice: answered wrong last time, or forgotten after
 * they were learned. Wrong last time comes first, then the most forgotten.
 */
export function hardCards(cards) {
    return cards
        .filter((c) => !isNew(c) && (c.lastRating === 1 || (c.lapses ?? 0) > 0))
        .sort((a, b) => Number(b.lastRating === 1) - Number(a.lastRating === 1) ||
        (b.lapses ?? 0) - (a.lapses ?? 0) ||
        (a.ease ?? 2.5) - (b.ease ?? 2.5));
}
export function shuffle(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
/** Days in a row with at least one answer. Today still counts as "open", so a streak survives until midnight. */
export function streak(history, now = Date.now()) {
    let day = history[dayKey(now)]?.reviews ? now : addDays(now, -1);
    let count = 0;
    while (history[dayKey(day)]?.reviews) {
        count++;
        day = addDays(day, -1);
    }
    return count;
}
export function reviewsOn(history, t) {
    return history[dayKey(t)]?.reviews ?? 0;
}
/** Rough duration of a round, assuming about 10 seconds per card. */
export function minutesFor(cards) {
    return Math.max(1, Math.round((cards * 10) / 60));
}
