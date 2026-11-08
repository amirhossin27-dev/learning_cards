import type { Card, Deck } from '../types';
import { bareTerm, findCloze, normalize, PAIR_COUNT, PAIR_MAX_LENGTH, pickDistractors, type Candidate, type Cloze, type StudyMethod } from './quiz';

/**
 * Turns a card into a question for the chosen study method. A card that
 * doesn't suit the method (no example sentence for a gap, no second language
 * to listen to) is asked as plain multiple choice instead.
 */

export interface StudyItem {
  card: Card;
  /** Whether the card's back side is shown as the question. */
  reversed: boolean;
}

interface Base {
  options: string[];
  correct: number;
  /** Shown when the card is asked differently from the chosen method. */
  fallback?: string;
}

export type Question =
  | (Base & { kind: 'choice' })
  | (Base & { kind: 'cloze'; cloze: Cloze })
  | (Base & { kind: 'listen' })
  | (Base & { kind: 'truefalse'; shown: string; isTrue: boolean });

export interface StudyData {
  cards: Card[];
  decks: Deck[];
}

const side = (c: Card, reversed: boolean) => (reversed ? c.front : c.back);

export function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Wrong answers for a card: from its own deck first, from other decks in the same language when that is too small. */
function wrongAnswers(item: StudyItem, data: StudyData, count: number, random: () => number): string[] {
  const { card, reversed } = item;
  const deck = data.decks.find((d) => d.id === card.deckId);
  const answer = side(card, reversed);
  const others = data.cards.filter((c) => c.id !== card.id);
  const candidates: Candidate[] = others.filter((c) => c.deckId === card.deckId).map((c) => ({ text: side(c, reversed), tag: c.tag, near: true }));
  let wrong = pickDistractors(answer, card.tag, candidates, count, random);
  if (wrong.length < count && deck) {
    const lang = reversed ? deck.frontLang : deck.backLang;
    const byId = new Map(data.decks.map((d) => [d.id, d]));
    for (const c of others) {
      const d = byId.get(c.deckId);
      if (!d || d.id === deck.id) continue;
      if (d.backLang === lang) candidates.push({ text: c.back, tag: c.tag, near: false });
      else if (d.frontLang === lang) candidates.push({ text: c.front, tag: c.tag, near: false });
    }
    wrong = pickDistractors(answer, card.tag, candidates, count, random);
  }
  return wrong;
}

function choice(item: StudyItem, data: StudyData, random: () => number, fallback?: string): Question | null {
  const answer = side(item.card, item.reversed);
  const wrong = wrongAnswers(item, data, 3, random);
  if (wrong.length === 0) return null;
  const options = shuffled([answer, ...wrong], random);
  return { kind: 'choice', options, correct: options.indexOf(answer), fallback };
}

/** A gap in the example sentence, for cards whose front term appears in it. */
export function clozeFor(card: Card): Cloze | null {
  return card.example ? findCloze(card.front, card.example) : null;
}

/** Listening only makes sense for language decks, where the question side is spoken in another language. */
export function canListen(card: Card, decks: Deck[]): boolean {
  const deck = decks.find((d) => d.id === card.deckId);
  return !!deck && deck.frontLang !== deck.backLang;
}

export function isPairable(item: StudyItem): boolean {
  return item.card.front.length <= PAIR_MAX_LENGTH && item.card.back.length <= PAIR_MAX_LENGTH;
}

/**
 * How many items from `start` on make up the next round of pairs: up to five
 * short cards in a row, without the same card or the same text twice.
 */
export function pairChunk(items: StudyItem[], start: number): number {
  const ids = new Set<string>();
  const texts = new Set<string>();
  let n = 0;
  for (let i = start; i < items.length && n < PAIR_COUNT; i++) {
    const item = items[i];
    const q = normalize(side(item.card, !item.reversed));
    const a = normalize(side(item.card, item.reversed));
    if (!isPairable(item) || ids.has(item.card.id) || texts.has(`q:${q}`) || texts.has(`a:${a}`)) break;
    ids.add(item.card.id);
    texts.add(`q:${q}`);
    texts.add(`a:${a}`);
    n++;
  }
  return n;
}

/** Which methods make sense for these cards, in the order of the picker. */
export function availableMethods(cards: Card[], decks: Deck[], speech: boolean): StudyMethod[] {
  const out: StudyMethod[] = ['flip', 'choice'];
  if (cards.filter((c) => clozeFor(c)).length >= 4) out.push('cloze');
  if (speech && cards.some((c) => canListen(c, decks))) out.push('listen');
  if (cards.filter((c) => isPairable({ card: c, reversed: false })).length >= 2) out.push('pairs');
  out.push('truefalse');
  return out;
}

/** The question for one card, or null to show the flip card. Pairs are built per round, see `pairChunk`. */
export function buildQuestion(item: StudyItem, method: StudyMethod, data: StudyData, random: () => number = Math.random): Question | null {
  const { card } = item;
  switch (method) {
    case 'flip':
    case 'pairs':
      return null;
    case 'choice':
      return choice(item, data, random);
    case 'cloze': {
      const cloze = clozeFor(card);
      if (!cloze) return choice(item, data, random, 'Ohne passenden Beispielsatz: als Auswahl');
      const answer = bareTerm(card.front);
      const pool: Candidate[] = data.cards
        .filter((c) => c.id !== card.id && c.deckId === card.deckId)
        .map((c) => ({ text: bareTerm(c.front), tag: c.tag, near: true }))
        .filter((c) => c.text.length > 0 && c.text.length <= PAIR_MAX_LENGTH);
      const wrong = pickDistractors(answer, card.tag, pool, 3, random);
      if (wrong.length === 0) return choice(item, data, random);
      const options = shuffled([answer, ...wrong], random);
      return { kind: 'cloze', cloze, options, correct: options.indexOf(answer) };
    }
    case 'listen': {
      if (!canListen(card, data.decks)) return choice(item, data, random, 'Kein Sprachstapel: als Auswahl');
      const q = choice(item, data, random);
      return q && { ...q, kind: 'listen' };
    }
    case 'truefalse': {
      const answer = side(card, item.reversed);
      const [wrong] = wrongAnswers(item, data, 1, random);
      const isTrue = !wrong || random() < 0.5;
      return { kind: 'truefalse', shown: isTrue ? answer : wrong, isTrue, options: ['Falsch', 'Richtig'], correct: isTrue ? 1 : 0 };
    }
  }
}
