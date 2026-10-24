import type { Card } from '../types';

/**
 * Spaced repetition: a small SM-2 variant with four answer buttons.
 *
 * Cards with interval 0 are "learning" (new or forgotten). "Gut" moves them to
 * a one-day interval, after that each "Gut" multiplies the interval by the
 * card's ease. The interval also decides the Leitner box ("Fach") shown in
 * the UI, so the five boxes stay meaningful without a separate counter.
 */

export type Rating = 1 | 2 | 3 | 4;

export const RATINGS: { value: Rating; label: string }[] = [
  { value: 1, label: 'Nochmal' },
  { value: 2, label: 'Schwer' },
  { value: 3, label: 'Gut' },
  { value: 4, label: 'Leicht' },
];

export const MINUTE = 60_000;
export const DAY = 86_400_000;
export const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

export const BOX_COUNT = 5;
export const MASTERED_BOX = 4;
/** Minimum interval in days for each box. */
const BOX_THRESHOLDS = [0, 1, 3, 7, 21];
export const BOX_LABELS = ['Fach 1', 'Fach 2', 'Fach 3', 'Fach 4', 'Gemeistert'];

export function boxForInterval(days: number): number {
  let box = 0;
  BOX_THRESHOLDS.forEach((min, i) => {
    if (days >= min) box = i;
  });
  return box;
}

export type SrsFields = Pick<Card, 'box' | 'interval' | 'ease' | 'due' | 'reps' | 'lapses' | 'lastReviewed'>;

export function schedule(card: Partial<SrsFields>, rating: Rating, now: number): Required<SrsFields> {
  const interval = card.interval ?? 0;
  const ease = card.ease ?? DEFAULT_EASE;
  const learning = interval < 1;
  let next = 0;
  let nextEase = ease;
  let lapses = card.lapses ?? 0;
  let wait: number;

  switch (rating) {
    case 1:
      if (!learning) {
        lapses++;
        nextEase = Math.max(MIN_EASE, ease - 0.2);
      }
      wait = MINUTE;
      break;
    case 2:
      if (learning) {
        wait = 10 * MINUTE;
      } else {
        next = Math.max(1, Math.round(interval * 1.2));
        nextEase = Math.max(MIN_EASE, ease - 0.15);
        wait = next * DAY;
      }
      break;
    case 3:
      next = learning ? 1 : Math.max(interval + 1, Math.round(interval * ease));
      wait = next * DAY;
      break;
    case 4:
      next = learning ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
      nextEase = ease + 0.15;
      wait = next * DAY;
      break;
  }

  return {
    box: boxForInterval(next),
    interval: next,
    ease: Math.round(nextEase * 100) / 100,
    due: now + wait,
    reps: (card.reps ?? 0) + 1,
    lapses,
    lastReviewed: now,
  };
}

/** Whether a learning card should come back later in the same round. */
export function repeatsInSession(card: Partial<SrsFields>, rating: Rating): boolean {
  return rating === 1 || (rating === 2 && (card.interval ?? 0) < 1);
}

export function formatWait(ms: number): string {
  if (ms < 2 * MINUTE) return '< 1 Min.';
  if (ms < 60 * MINUTE) return `${Math.round(ms / MINUTE)} Min.`;
  const days = Math.round(ms / DAY);
  if (days < 1) return `${Math.round(ms / (60 * MINUTE))} Std.`;
  if (days === 1) return '1 Tag';
  if (days < 31) return `${days} Tage`;
  if (days < 365) return `${Math.round(days / 30)} Mon.`;
  return `${(days / 365).toFixed(1).replace('.', ',').replace(',0', '')} J.`;
}

/** The waiting time each answer button would give, for the labels under the buttons. */
export function previewWaits(card: Partial<SrsFields>, now: number): Record<Rating, string> {
  const out = {} as Record<Rating, string>;
  for (const { value } of RATINGS) out[value] = formatWait(schedule(card, value, now).due - now);
  return out;
}

// --- Calendar days (local time) -------------------------------------------

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Same calendar day `n` days before `t` (handles DST by working on dates, not milliseconds). */
export function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function isNew(card: Pick<Card, 'lastReviewed'>): boolean {
  return card.lastReviewed === undefined;
}

/** Due at some point today (or overdue). New cards are never "due"; they are introduced by the daily budget. */
export function isDue(card: Pick<Card, 'lastReviewed' | 'due'>, now: number): boolean {
  return !isNew(card) && (card.due ?? 0) <= endOfDay(now);
}

/** Converts a version 1 card (Leitner box 0–5 without dates) into the new schedule. */
export function migrateLegacy(card: Pick<Card, 'box' | 'lastReviewed'>): Partial<SrsFields> {
  if (card.lastReviewed === undefined) return { box: 0 };
  const interval = [0, 1, 3, 7, 21, 30][Math.max(0, Math.min(5, card.box))];
  return {
    box: boxForInterval(interval),
    interval,
    ease: DEFAULT_EASE,
    due: card.lastReviewed + interval * DAY,
    reps: Math.max(1, card.box),
    lapses: 0,
  };
}
