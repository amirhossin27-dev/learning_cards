import { describe, expect, it } from 'vitest';
import type { Card } from '../types';
import { added } from '../data/decks/util';
import type { SeedCard, SeedDeck } from '../data/seed';
import { DAY } from './srs';
import { buildStream, deckStats, logAnswer, migrate, planToday, requeue, streak, withBuiltIns } from './store';

const NOON = new Date(2026, 9, 24, 12).getTime();

const card = (id: string, fields: Partial<Card> = {}): Card => ({
  id,
  deckId: 'd',
  front: id,
  back: id,
  box: 0,
  createdAt: 0,
  ...fields,
});

describe('planToday', () => {
  it('lists due cards (most overdue first) and all new cards in deck order', () => {
    const cards = [
      card('later', { lastReviewed: 1, due: NOON + 3 * DAY, box: 2 }),
      card('due-today', { lastReviewed: 1, due: NOON + 2 * 3600_000, box: 1 }),
      card('overdue', { lastReviewed: 1, due: NOON - 2 * DAY, box: 1 }),
      card('new-b', { deckId: 'b', createdAt: 1 }),
      card('new-a', { deckId: 'a', createdAt: 2 }),
      card('new-a2', { deckId: 'a', createdAt: 3 }),
    ];
    const plan = planToday(cards, ['a', 'b'], NOON);
    expect(plan.due.map((c) => c.id)).toEqual(['overdue', 'due-today']);
    expect(plan.fresh.map((c) => c.id)).toEqual(['new-a', 'new-a2', 'new-b']);
  });
});

describe('buildStream', () => {
  const same = <T,>(items: T[]) => items;
  const due = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].map((id) => card(id, { lastReviewed: 1, due: 1 }));
  const fresh = ['n1', 'n2', 'n3', 'n4'].map((id) => card(id));

  it('mixes a new card in after every three cards to repeat, then goes on with the new ones', () => {
    const ids = buildStream({ due, fresh }, same).map((c) => c.id);
    expect(ids).toEqual(['d1', 'd2', 'd3', 'n1', 'd4', 'd5', 'd6', 'n2', 'd7', 'n3', 'n4']);
  });

  it('works with only new cards and with nothing new', () => {
    expect(buildStream({ due: [], fresh }, same).map((c) => c.id)).toEqual(['n1', 'n2', 'n3', 'n4']);
    expect(buildStream({ due, fresh: [] }, same)).toHaveLength(7);
    expect(buildStream({ due: [], fresh: [] })).toEqual([]);
  });

  it('shuffles what is due but keeps every card exactly once', () => {
    const ids = buildStream({ due, fresh }).map((c) => c.id);
    expect([...ids].sort()).toEqual([...due, ...fresh].map((c) => c.id).sort());
  });
});

describe('requeue', () => {
  it('brings a card back a few places later, or at the end of a short queue', () => {
    expect(requeue(['a', 'b', 'c', 'd', 'e', 'f'], 1, ['b2'], 3)).toEqual(['a', 'b', 'c', 'd', 'e', 'b2', 'f']);
    expect(requeue(['a', 'b'], 1, ['b2'], 3)).toEqual(['a', 'b', 'b2']);
  });
});

describe('deckStats', () => {
  it('counts new, learning, sitting and due cards', () => {
    const stats = deckStats(
      [card('a'), card('b', { lastReviewed: 1, due: NOON - DAY, box: 1 }), card('c', { lastReviewed: 1, due: NOON + 5 * DAY, box: 2 }), card('d', { lastReviewed: 1, due: NOON + 40 * DAY, box: 4 })],
      NOON,
    );
    expect(stats).toEqual({ total: 4, fresh: 1, learning: 2, solid: 1, due: 1 });
  });
});

describe('streak and history', () => {
  it('counts consecutive study days and keeps today open until midnight', () => {
    let history = {};
    history = logAnswer(history, NOON - 2 * DAY, true);
    history = logAnswer(history, NOON - DAY, false);
    expect(streak(history, NOON)).toBe(2);
    history = logAnswer(history, NOON, true);
    expect(streak(history, NOON)).toBe(3);
    expect(history).toMatchObject({ '2026-10-24': { reviews: 1, fresh: 1 }, '2026-10-23': { reviews: 1, fresh: 0 } });
    expect(streak(history, NOON + 2 * DAY)).toBe(0);
  });
});

describe('migrate', () => {
  it('turns version 1 Leitner boxes into due dates and emojis into icons', () => {
    const data = migrate({
      version: 1,
      decks: [{ id: 'd', name: 'D', description: '', emoji: '💼', color: 0, frontLang: 'en-US', backLang: 'de-DE', createdAt: 0 } as never],
      cards: [card('seen', { box: 3, lastReviewed: NOON }), card('fresh')],
    });
    expect(data.version).toBe(2);
    expect(data.decks[0].icon).toBe('briefcase');
    expect(data.cards[0]).toMatchObject({ interval: 7, box: 3, due: NOON + 7 * DAY });
    expect(data.cards[1].due).toBeUndefined();
    expect(data.history).toEqual({});
  });

  it('drops the daily goal, round size and new cards per day from stored settings', () => {
    const data = migrate({ settings: { dailyGoal: 30, sessionSize: 10, newPerDay: 5, autoSpeak: true } as never });
    expect(data.settings).not.toHaveProperty('dailyGoal');
    expect(data.settings).not.toHaveProperty('sessionSize');
    expect(data.settings).not.toHaveProperty('newPerDay');
    expect(data.settings.autoSpeak).toBe(true);
  });

  it('moves decks that used the removed listening method to multiple choice', () => {
    const data = migrate({ settings: { methods: { a: 'listen', b: 'cloze', c: 'type', d: 'unknown' } } as never });
    expect(data.settings.methods).toEqual({ a: 'choice', b: 'cloze', c: 'choice' });
  });
});

describe('withBuiltIns', () => {
  const seed = (cards: SeedCard[]): SeedDeck => ({
    id: 'b',
    name: 'Built-in',
    description: 'Neu',
    oldDescriptions: ['Alt'],
    icon: 'book',
    color: 0,
    frontLang: 'de-DE',
    backLang: 'de-DE',
    cards,
  });
  const first = [{ front: 'Eins', back: '1' }, { front: 'Zwei', back: '2', tag: 'Zahl' }];
  const later = [...first, ...added('2026-10-25', [{ front: 'Drei', back: '3' }, { front: 'Vier', back: '4' }])];

  it('seeds a new deck with all its cards', () => {
    const data = withBuiltIns(migrate({}), false, [seed(later)]);
    expect(data.cards.map((c) => c.front)).toEqual(['Eins', 'Zwei', 'Drei', 'Vier']);
    expect(data.cards[2]).not.toHaveProperty('added');
    expect(data.seededCards.b).toEqual(['eins', 'zwei', 'drei', 'vier']);
    expect(data.decks[0]).not.toHaveProperty('oldDescriptions');
  });

  it('adds new cards to a deck installed before they existed, once', () => {
    // An install from before seededCards existed, where the user deleted "Eins" and studied "Zwei".
    const old = migrate({
      decks: [{ id: 'b', name: 'Built-in', description: 'Alt', icon: 'book', color: 0, frontLang: 'de-DE', backLang: 'de-DE', builtIn: true, createdAt: 0 }],
      cards: [card('zwei', { deckId: 'b', front: 'Zwei', back: '2', box: 2, lastReviewed: 1 })],
      seeded: ['b'],
    });
    const synced = withBuiltIns(old, false, [seed(later)]);
    expect(synced.cards.map((c) => c.front)).toEqual(['Zwei', 'Drei', 'Vier']);
    expect(synced.cards[0]).toMatchObject({ id: 'zwei', box: 2, tag: 'Zahl' });
    expect(synced.decks[0].description).toBe('Neu');

    // The user deletes a new card: it must not come back on the next start.
    const pruned = { ...synced, cards: synced.cards.filter((c) => c.front !== 'Drei') };
    const again = withBuiltIns(pruned, false, [seed(later)]);
    expect(again.cards.map((c) => c.front)).toEqual(['Zwei', 'Vier']);
  });

  it('leaves a deleted built-in deck deleted and a renamed description alone', () => {
    const data = withBuiltIns(migrate({ seeded: ['b'] }), false, [seed(later)]);
    expect(data.decks).toEqual([]);
    const renamed = migrate({
      decks: [{ id: 'b', name: 'Built-in', description: 'Meins', icon: 'book', color: 0, frontLang: 'de-DE', backLang: 'de-DE', createdAt: 0 }],
      seeded: ['b'],
    });
    expect(withBuiltIns(renamed, false, [seed(later)]).decks[0].description).toBe('Meins');
  });
});
