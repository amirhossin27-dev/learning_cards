import type { Rating } from './srs';

/**
 * Building blocks for the quiz methods: picking wrong answers for multiple
 * choice and checking a typed answer with some tolerance.
 */

export type StudyMethod = 'flip' | 'choice' | 'type';

export const METHODS: { value: StudyMethod; label: string }[] = [
  { value: 'flip', label: 'Karte' },
  { value: 'choice', label: 'Auswahl' },
  { value: 'type', label: 'Tippen' },
];

const UMLAUTS: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/**
 * Lower case, umlauts spelled out (so "Muenchen" equals "München"), other
 * accents dropped, punctuation and extra spaces removed.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUTS[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Splits at commas, semicolons and slashes that are not inside brackets. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth++;
    else if ((ch === ')' || ch === ']') && depth > 0) depth--;
    if (depth === 0 && (ch === ',' || ch === ';' || ch === '/')) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const withoutBrackets = (text: string) => text.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');
const LEADING_WORD = /^(to|the|a|an|der|die|das|ein|eine|le|la|les|el|los|las|il|lo|gli)\s+/;
const words = (text: string) => normalize(text).split(' ').filter(Boolean).length;

/**
 * All spellings that count as correct, normalized. "(ein Meeting / Projekt) starten"
 * also accepts "starten", "to kick off" also "kick off", and a list of short
 * synonyms like "Tagesordnung, Agenda" accepts each one.
 */
export function answerVariants(answer: string): string[] {
  const out = new Set<string>();
  const add = (text: string) => {
    const n = normalize(text);
    if (!n) return;
    out.add(n);
    const bare = n.replace(LEADING_WORD, '');
    if (bare) out.add(bare);
  };
  add(answer);
  add(withoutBrackets(answer));
  const parts = splitTopLevel(answer);
  // Only lists of short items are synonyms; a comma inside a sentence is not.
  if (parts.length > 1 && parts.every((p) => words(withoutBrackets(p)) <= 3)) {
    for (const p of parts) {
      add(p);
      add(withoutBrackets(p));
    }
  }
  return [...out];
}

/** Longer answers (explanations, sentences) are better asked as multiple choice. */
export const MAX_TYPED_LENGTH = 30;

export function isTypeable(answer: string): boolean {
  return answerVariants(answer).some((v) => v.length <= MAX_TYPED_LENGTH);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/** How many typos an answer of this length may have. Short words must be exact. */
export function allowedTypos(length: number): number {
  if (length < 4) return 0;
  if (length < 12) return 1;
  return 2;
}

const digits = (text: string) => text.replace(/\D/g, '');

export type Verdict = 'exact' | 'typo' | 'wrong';

export function checkTyped(input: string, answer: string): Verdict {
  const typed = normalize(input);
  if (!typed) return 'wrong';
  const variants = answerVariants(answer);
  const bare = typed.replace(LEADING_WORD, '');
  if (variants.includes(typed) || variants.includes(bare)) return 'exact';
  const close = variants.some((v) => {
    const limit = allowedTypos(v.length);
    // A typo in a word is fine, a wrong number (year, amount) is not.
    if (digits(v) !== digits(typed)) return false;
    return limit > 0 && Math.min(levenshtein(typed, v), levenshtein(bare, v)) <= limit;
  });
  return close ? 'typo' : 'wrong';
}

export interface Candidate {
  text: string;
  tag?: string;
  /** From the same deck as the question. */
  near: boolean;
}

/**
 * Picks wrong answers for a multiple choice question: from the same deck
 * first, preferably with the same tag and a similar length, never twice the
 * same text and never something that counts as the right answer.
 */
export function pickDistractors(
  answer: string,
  tag: string | undefined,
  candidates: Candidate[],
  count = 3,
  random: () => number = Math.random,
): string[] {
  const right = new Set(answerVariants(answer));
  right.add(normalize(answer));
  const seen = new Set<string>();
  const scored: { text: string; score: number }[] = [];
  for (const c of candidates) {
    const key = normalize(c.text);
    if (!key || right.has(key) || seen.has(key)) continue;
    seen.add(key);
    const ratio = Math.min(c.text.length, answer.length) / Math.max(c.text.length, answer.length, 1);
    const score = (c.near ? 3 : 0) + (tag && c.tag === tag ? 2 : 0) + ratio * 1.5 + random() * 0.9;
    scored.push({ text: c.text, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.text);
}

/** Time in ms under which a right answer counts as "Leicht". */
export function fastLimit(method: StudyMethod, answer: string): number {
  if (method === 'type') return Math.min(15_000, 5_000 + answer.length * 200);
  return 5_000;
}

/** Turns a quiz result into one of the four ratings of the schedule. */
export function autoRating(correct: boolean, verdict: Verdict | undefined, elapsed: number, limit: number): Rating {
  if (!correct) return 1;
  if (verdict === 'typo') return 3;
  return elapsed < limit ? 4 : 3;
}
