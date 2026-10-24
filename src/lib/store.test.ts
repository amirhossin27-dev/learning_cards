import { describe, expect, it } from 'vitest';
import type { Card } from '../types';
import { DAY } from './srs';
import { buildPractice, buildSession, deckStats, logAnswer, migrate, newCardsLeft, planToday, streak } from './store';

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
  it('lists due cards (most overdue first) and new cards within the budget', () => {
    const cards = [
      card('later', { lastReviewed: 1, due: NOON + 3 * DAY, box: 2 }),
      card('due-today', { lastReviewed: 1, due: NOON + 2 * 3600_000, box: 1 }),
      card('overdue', { lastReviewed: 1, due: NOON - 2 * DAY, box: 1 }),
      card('new-b', { deckId: 'b', createdAt: 1 }),
      card('new-a', { deckId: 'a', createdAt: 2 }),
      card('new-a2', { deckId: 'a', createdAt: 3 }),
    ];
    const plan = planToday(cards, 2, ['a', 'b'], NOON);
    expect(plan.due.map((c) => c.id)).toEqual(['overdue', 'due-today']);
    expect(plan.fresh.map((c) => c.id)).toEqual(['new-a', 'new-a2']);
    expect(buildSession(plan, 3).map((c) => c.id)).toEqual(['overdue', 'due-today', 'new-a']);
  });

  it('counts how many new cards are left for today', () => {
    const settings = { newPerDay: 10 } as never;
    expect(newCardsLeft({ settings, history: {} }, NOON)).toBe(10);
    expect(newCardsLeft({ settings, history: { '2026-10-24': { reviews: 30, fresh: 12 } } }, NOON)).toBe(0);
  });
});

describe('buildPractice', () => {
  it('puts weak and long-unseen cards first and respects the size', () => {
    const cards = [card('mastered', { box: 4, lastReviewed: 1 }), card('new'), card('old', { box: 2, lastReviewed: 1 }), card('recent', { box: 2, lastReviewed: 9 })];
    expect(buildPractice(cards, 3).map((c) => c.id)).toEqual(['new', 'old', 'recent']);
    expect(buildPractice(cards, 0)).toHaveLength(4);
  });
});

describe('deckStats', () => {
  it('counts boxes, new, due and mastered cards', () => {
    const stats = deckStats(
      [card('a'), card('b', { lastReviewed: 1, due: NOON - DAY, box: 1 }), card('c', { lastReviewed: 1, due: NOON + 5 * DAY, box: 2 }), card('d', { lastReviewed: 1, due: NOON + 40 * DAY, box: 4 })],
      NOON,
    );
    expect(stats).toMatchObject({ total: 4, fresh: 1, due: 1, mastered: 1, boxes: [1, 1, 1, 0, 1] });
    expect(stats.progress).toBeCloseTo((0 + 1 + 2 + 4) / 16);
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
    expect(data.settings.dailyGoal).toBe(20);
    expect(data.history).toEqual({});
  });
});
