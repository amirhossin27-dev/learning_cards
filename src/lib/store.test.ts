import { describe, expect, it } from 'vitest';
import type { Card } from '../types';
import { buildSession, deckStats } from './store';

const card = (id: string, box: number, lastReviewed?: number): Card => ({
  id,
  deckId: 'd',
  front: id,
  back: id,
  box,
  lastReviewed,
  createdAt: 0,
});

describe('buildSession', () => {
  it('puts weak and long-unseen cards first and respects the size', () => {
    const cards = [card('mastered', 5, 1), card('new', 0), card('learning-old', 2, 1), card('learning-new', 2, 9)];
    const session = buildSession(cards, 3).map((c) => c.id);
    expect(session).toEqual(['new', 'learning-old', 'learning-new']);
  });

  it('returns all cards for size 0', () => {
    expect(buildSession([card('a', 0), card('b', 1)], 0)).toHaveLength(2);
  });
});

describe('deckStats', () => {
  it('splits cards into new, learning and mastered', () => {
    const stats = deckStats([card('a', 0), card('b', 0, 5), card('c', 2, 5), card('d', 4, 5)]);
    expect(stats).toMatchObject({ total: 4, fresh: 1, learning: 2, mastered: 1 });
    expect(stats.progress).toBeCloseTo((0 + 0 + 2 + 4) / 16);
  });
});
