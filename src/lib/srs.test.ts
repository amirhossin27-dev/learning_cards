import { describe, expect, it } from 'vitest';
import { boxForInterval, DAY, formatWait, isDue, MINUTE, previewWaits, repeatsInSession, schedule } from './srs';

const NOW = new Date(2026, 9, 24, 12).getTime();

describe('schedule', () => {
  it('graduates new cards with Gut and Leicht, keeps them learning with Nochmal and Schwer', () => {
    expect(schedule({}, 1, NOW)).toMatchObject({ interval: 0, box: 0, due: NOW + MINUTE, reps: 1 });
    expect(schedule({}, 2, NOW)).toMatchObject({ interval: 0, due: NOW + 10 * MINUTE });
    expect(schedule({}, 3, NOW)).toMatchObject({ interval: 1, box: 1, due: NOW + DAY });
    expect(schedule({}, 4, NOW)).toMatchObject({ interval: 4, box: 2, ease: 2.65 });
  });

  it('grows the interval of learned cards by their ease', () => {
    const learned = { interval: 4, ease: 2.5, reps: 3, lapses: 0 };
    expect(schedule(learned, 3, NOW).interval).toBe(10);
    expect(schedule(learned, 2, NOW)).toMatchObject({ interval: 5, ease: 2.35 });
    expect(schedule(learned, 4, NOW).interval).toBe(13);
  });

  it('sends forgotten cards back to box 1 and counts the lapse', () => {
    const result = schedule({ interval: 30, ease: 2.5, lapses: 1 }, 1, NOW);
    expect(result).toMatchObject({ interval: 0, box: 0, lapses: 2, ease: 2.3 });
  });

  it('never lets the ease drop below 1.3', () => {
    expect(schedule({ interval: 10, ease: 1.35 }, 1, NOW).ease).toBe(1.3);
  });
});

describe('helpers', () => {
  it('maps intervals to the five boxes', () => {
    expect([0, 1, 2, 3, 6, 7, 20, 21, 400].map(boxForInterval)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('repeats learning cards in the same round', () => {
    expect(repeatsInSession({}, 1)).toBe(true);
    expect(repeatsInSession({}, 2)).toBe(true);
    expect(repeatsInSession({ interval: 5 }, 2)).toBe(false);
    expect(repeatsInSession({}, 3)).toBe(false);
  });

  it('formats waiting times in German', () => {
    expect(formatWait(MINUTE)).toBe('< 1 Min.');
    expect(formatWait(10 * MINUTE)).toBe('10 Min.');
    expect(formatWait(DAY)).toBe('1 Tag');
    expect(formatWait(8 * DAY)).toBe('8 Tage');
    expect(formatWait(90 * DAY)).toBe('3 Mon.');
    expect(formatWait(365 * DAY)).toBe('1 J.');
    expect(previewWaits({}, NOW)).toEqual({ 1: '< 1 Min.', 2: '10 Min.', 3: '1 Tag', 4: '4 Tage' });
  });

  it('treats a card as due for the whole calendar day', () => {
    const evening = new Date(2026, 9, 24, 22).getTime();
    expect(isDue({ lastReviewed: 1, due: evening }, NOW)).toBe(true);
    expect(isDue({ lastReviewed: 1, due: evening + 3 * 3600_000 }, NOW)).toBe(false);
    expect(isDue({ lastReviewed: undefined, due: undefined }, NOW)).toBe(false);
  });
});
