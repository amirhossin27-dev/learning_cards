import type { Rating } from './srs';

/** Building blocks for multiple choice: picking wrong answers and rating the result. */

export type StudyMethod = 'flip' | 'choice';

export const METHODS: { value: StudyMethod; label: string }[] = [
  { value: 'flip', label: 'Karte' },
  { value: 'choice', label: 'Auswahl' },
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
 * All spellings of an answer, normalized, so a wrong option is never just
 * another way of writing the right one. "(ein Meeting / Projekt) starten"
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
export const FAST_ANSWER = 5_000;

/** Turns a multiple choice result into one of the four ratings of the schedule. */
export function autoRating(correct: boolean, elapsed: number, limit = FAST_ANSWER): Rating {
  if (!correct) return 1;
  return elapsed < limit ? 4 : 3;
}
