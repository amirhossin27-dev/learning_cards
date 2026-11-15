import type { Card, Deck } from '../types';
import { bareTerm, findCloze, METHODS, normalize, PAIR_COUNT, PAIR_MAX_LENGTH, pickDistractors, type Candidate, type Cloze, type StudyMethod } from './quiz';

/**
 * Turns a card into a question for the chosen study method. Each card is only
 * asked in the ways that fit it (a gap needs an example sentence with the
 * word in it, pairs need short texts) and that are ticked for it in the card
 * editor; for anything else it gets the closest method it has.
 */

export interface StudyItem {
  card: Card;
  /** Whether the card's back side is shown as the question. */
  reversed: boolean;
}

interface Base {
  options: string[];
  correct: number;
}

export type Question =
  | (Base & { kind: 'choice' })
  | (Base & { kind: 'cloze'; cloze: Cloze })
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

function choice(item: StudyItem, data: StudyData, random: () => number): Question | null {
  const answer = side(item.card, item.reversed);
  const wrong = wrongAnswers(item, data, 3, random);
  if (wrong.length === 0) return null;
  const options = shuffled([answer, ...wrong], random);
  return { kind: 'choice', options, correct: options.indexOf(answer) };
}

/** A gap in the example sentence, for cards whose front term appears in it. */
export function clozeFor(card: Card): Cloze | null {
  return card.example ? findCloze(card.front, card.example) : null;
}

/** Whether a method can work with this card at all, whatever is ticked for it. */
export function fitsCard(card: Pick<Card, 'front' | 'back' | 'example'>, method: StudyMethod): boolean {
  if (method === 'cloze') return !!card.example && !!findCloze(card.front, card.example);
  if (method === 'pairs') return card.front.length <= PAIR_MAX_LENGTH && card.back.length <= PAIR_MAX_LENGTH;
  return true;
}

/**
 * The methods this card is asked with: those that fit it, minus the ones
 * switched off for it. A card always keeps at least the flip card.
 */
export function cardMethods(card: Card): StudyMethod[] {
  const fitting = METHODS.map((m) => m.value).filter((m) => fitsCard(card, m));
  const chosen = card.methods ? fitting.filter((m) => card.methods!.includes(m)) : fitting;
  return chosen.length ? chosen : ['flip'];
}

/** Where a card goes when it doesn't have the chosen method: tapping stays tapping, turning stays turning. */
const CLOSEST: Record<StudyMethod, StudyMethod[]> = {
  flip: ['flip', 'choice', 'truefalse', 'cloze', 'pairs'],
  choice: ['choice', 'cloze', 'truefalse', 'flip', 'pairs'],
  cloze: ['cloze', 'choice', 'truefalse', 'flip', 'pairs'],
  pairs: ['pairs', 'choice', 'truefalse', 'cloze', 'flip'],
  truefalse: ['truefalse', 'choice', 'cloze', 'flip', 'pairs'],
};

/** The chosen method if it is among `methods`, else the closest one that is. */
export function closestMethod(methods: StudyMethod[], preferred: StudyMethod): StudyMethod {
  return CLOSEST[preferred].find((m) => methods.includes(m)) ?? 'flip';
}

/** The method this card is asked with when `preferred` is chosen for the round. */
export function methodFor(card: Card, preferred: StudyMethod): StudyMethod {
  return closestMethod(cardMethods(card), preferred);
}

export function isPairable(item: StudyItem): boolean {
  return cardMethods(item.card).includes('pairs');
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

/**
 * Which methods make sense for these cards, in the order of the picker: a
 * gap only with a few sentences to choose from, pairs only with two cards.
 */
export function availableMethods(cards: Card[]): StudyMethod[] {
  const count = new Map<StudyMethod, number>();
  for (const c of cards) for (const m of cardMethods(c)) count.set(m, (count.get(m) ?? 0) + 1);
  const needed: Partial<Record<StudyMethod, number>> = { cloze: 4, pairs: 2 };
  const out = METHODS.map((m) => m.value).filter((m) => (count.get(m) ?? 0) >= (needed[m] ?? 1));
  return out.length ? out : ['flip'];
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
      if (!cloze) return choice(item, data, random);
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
    case 'truefalse': {
      const answer = side(card, item.reversed);
      const [wrong] = wrongAnswers(item, data, 1, random);
      const isTrue = !wrong || random() < 0.5;
      return { kind: 'truefalse', shown: isTrue ? answer : wrong, isTrue, options: ['Falsch', 'Richtig'], correct: isTrue ? 1 : 0 };
    }
  }
}
