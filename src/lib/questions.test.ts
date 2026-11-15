import { describe, expect, it } from 'vitest';
import type { Card, Deck } from '../types';
import { availableMethods, buildQuestion, cardMethods, methodFor, pairChunk, type StudyItem } from './questions';

const deck = (id: string, frontLang: Deck['frontLang'], backLang: Deck['backLang']): Deck => ({
  id,
  name: id,
  description: '',
  icon: 'book',
  color: 0,
  frontLang,
  backLang,
  createdAt: 0,
});

const card = (id: string, front: string, back: string, fields: Partial<Card> = {}): Card => ({
  id,
  deckId: 'en',
  front,
  back,
  box: 0,
  createdAt: 0,
  ...fields,
});

const decks = [deck('en', 'en-US', 'de-DE'), deck('geo', 'de-DE', 'de-DE')];
const cards = [
  card('1', 'to kick off', 'starten', { example: "Let's kick off the meeting." }),
  card('2', 'agenda', 'Tagesordnung', { example: 'Is there anything else for the agenda?' }),
  card('3', 'deadline', 'Frist', { example: 'The deadline is Friday.' }),
  card('4', 'to circle back', 'darauf zurückkommen', { example: "Let's circle back to this later." }),
  card('5', 'stakeholder', 'Interessengruppe'),
  card('k', 'Kanada', 'Ottawa', { deckId: 'geo' }),
  card('s', 'Schweiz', 'Bern', { deckId: 'geo' }),
];
const data = { cards, decks };
const item = (c: Card, reversed = false): StudyItem => ({ card: c, reversed });
const fixed = () => 0.3;

describe('buildQuestion', () => {
  it('builds a gap in the example sentence with terms from the deck as options', () => {
    const q = buildQuestion(item(cards[0]), 'cloze', data, fixed);
    expect(q?.kind).toBe('cloze');
    if (q?.kind !== 'cloze') return;
    expect(q.cloze.gap).toBe('kick off');
    expect(q.options[q.correct]).toBe('kick off');
    expect(q.options).toHaveLength(4);
  });

  it('falls back to multiple choice without a matching example', () => {
    const q = buildQuestion(item(cards[4]), 'cloze', data, fixed);
    expect(q?.kind).toBe('choice');
  });

  it('shows either the right answer or a wrong one for true or false', () => {
    const right = buildQuestion(item(cards[5]), 'truefalse', data, () => 0.1);
    const wrong = buildQuestion(item(cards[5]), 'truefalse', data, () => 0.9);
    expect(right).toMatchObject({ kind: 'truefalse', shown: 'Ottawa', isTrue: true, correct: 1 });
    expect(wrong).toMatchObject({ kind: 'truefalse', shown: 'Bern', isTrue: false, correct: 0 });
  });

  it('shows the flip card for the flip method and for pairs', () => {
    expect(buildQuestion(item(cards[0]), 'flip', data)).toBeNull();
    expect(buildQuestion(item(cards[0]), 'pairs', data)).toBeNull();
  });
});

describe('pairChunk', () => {
  it('takes up to five short cards in a row, stopping at long or repeated ones', () => {
    const long = card('L', 'Was ist eine API?', 'Eine Schnittstelle, über die Programme miteinander kommunizieren.');
    const items = [...cards.slice(0, 3), cards[0], ...cards.slice(3)].map((c) => item(c));
    expect(pairChunk(items, 0)).toBe(3);
    expect(pairChunk(cards.map((c) => item(c)), 0)).toBe(5);
    expect(pairChunk([item(long), item(cards[0])], 0)).toBe(0);
  });
});

describe('availableMethods', () => {
  it('offers gaps and pairs only where they work', () => {
    expect(availableMethods(cards)).toEqual(['flip', 'choice', 'cloze', 'pairs', 'truefalse']);
    expect(availableMethods(cards.slice(5))).toEqual(['flip', 'choice', 'pairs', 'truefalse']);
  });

  it('leaves out methods switched off on the cards', () => {
    const off = cards.map((c) => ({ ...c, methods: ['flip' as const, 'choice' as const] }));
    expect(availableMethods(off)).toEqual(['flip', 'choice']);
  });
});

describe('cardMethods', () => {
  it('only lists the methods that fit the card', () => {
    expect(cardMethods(cards[0])).toEqual(['flip', 'choice', 'cloze', 'pairs', 'truefalse']);
    // A capital has no sentence, so no gap.
    expect(cardMethods(cards[5])).toEqual(['flip', 'choice', 'pairs', 'truefalse']);
  });

  it('respects the ticks from the card editor and keeps at least the flip card', () => {
    expect(cardMethods({ ...cards[0], methods: ['cloze', 'truefalse'] })).toEqual(['cloze', 'truefalse']);
    expect(cardMethods({ ...cards[5], methods: ['cloze'] })).toEqual(['flip']);
  });
});

describe('methodFor', () => {
  it('uses the chosen method when the card has it, else the closest one', () => {
    expect(methodFor(cards[0], 'cloze')).toBe('cloze');
    expect(methodFor(cards[5], 'cloze')).toBe('choice');
    expect(methodFor({ ...cards[5], methods: ['flip', 'truefalse'] }, 'choice')).toBe('truefalse');
    expect(methodFor({ ...cards[0], methods: ['choice'] }, 'flip')).toBe('choice');
  });
});
