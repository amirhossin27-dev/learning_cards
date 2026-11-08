import { describe, expect, it } from 'vitest';
import { answerVariants, autoRating, checkTyped, isTypeable, normalize, pickDistractors, type Candidate } from './quiz';

describe('normalize', () => {
  it('ignores case, punctuation, accents and spells out umlauts', () => {
    expect(normalize('  München! ')).toBe('muenchen');
    expect(normalize('Muenchen')).toBe('muenchen');
    expect(normalize('Brasília')).toBe('brasilia');
    expect(normalize('Straße')).toBe('strasse');
    expect(normalize('9. November 1989')).toBe('9 november 1989');
  });
});

describe('answerVariants', () => {
  it('makes bracketed parts and leading "to" / articles optional', () => {
    const v = answerVariants('(ein Meeting / Projekt) starten');
    expect(v).toContain('starten');
    expect(answerVariants('to kick off')).toContain('kick off');
  });

  it('splits short synonym lists but not sentences', () => {
    expect(answerVariants('Tagesordnung, Agenda')).toEqual(expect.arrayContaining(['tagesordnung', 'agenda']));
    const sentence = answerVariants('Eine Schnittstelle, über die Programme miteinander kommunizieren.');
    expect(sentence).not.toContain('eine schnittstelle');
  });
});

describe('isTypeable', () => {
  it('accepts short answers and rejects explanations', () => {
    expect(isTypeable('Ottawa')).toBe(true);
    expect(isTypeable('Johannes Gutenberg (um 1450)')).toBe(true);
    expect(isTypeable('Eine Schnittstelle, über die Programme miteinander kommunizieren.')).toBe(false);
  });
});

describe('checkTyped', () => {
  it('accepts exact answers in any case and with or without umlauts', () => {
    expect(checkTyped('ottawa', 'Ottawa')).toBe('exact');
    expect(checkTyped('Muenchen', 'München')).toBe('exact');
    expect(checkTyped('kick off', 'to kick off')).toBe('exact');
    expect(checkTyped('to circle back', 'to circle back')).toBe('exact');
    expect(checkTyped('starten', '(ein Meeting / Projekt) starten')).toBe('exact');
    expect(checkTyped('Agenda', 'Tagesordnung, Agenda')).toBe('exact');
  });

  it('tolerates one typo, two in long answers, none in short words', () => {
    expect(checkTyped('Otawa', 'Ottawa')).toBe('typo');
    expect(checkTyped('Tagesordnug', 'Tagesordnung')).toBe('typo');
    expect(checkTyped('Wiedervereinigng', 'Wiedervereinigung')).toBe('typo');
    expect(checkTyped('Rim', 'Rom')).toBe('wrong');
    expect(checkTyped('Toronto', 'Ottawa')).toBe('wrong');
  });

  it('never lets a wrong number pass as a typo', () => {
    expect(checkTyped('9. November 1988', '9. November 1989')).toBe('wrong');
    expect(checkTyped('9 Novmber 1989', '9. November 1989')).toBe('typo');
  });

  it('treats an empty answer as wrong', () => {
    expect(checkTyped('   ', 'Ottawa')).toBe('wrong');
  });
});

describe('pickDistractors', () => {
  const noRandom = () => 0;
  const pool: Candidate[] = [
    { text: 'Bern', tag: 'Europa', near: true },
    { text: 'Paris', tag: 'Europa', near: true },
    { text: 'bern', tag: 'Europa', near: true },
    { text: 'Ottawa', tag: 'Amerika', near: true },
    { text: 'Canberra', tag: 'Ozeanien', near: true },
    { text: 'Wien', tag: 'Europa', near: true },
    { text: 'Rom', tag: 'Europa', near: false },
  ];

  it('never offers the right answer or the same text twice', () => {
    const picked = pickDistractors('Bern', 'Europa', pool, 3, noRandom);
    expect(picked).toHaveLength(3);
    expect(picked.map(normalize)).not.toContain('bern');
    expect(new Set(picked.map(normalize)).size).toBe(3);
  });

  it('prefers the same deck and the same tag', () => {
    const picked = pickDistractors('Berlin', 'Europa', pool, 3, noRandom);
    expect(picked.sort()).toEqual(['Bern', 'Paris', 'Wien']);
  });

  it('returns fewer when there are not enough candidates', () => {
    expect(pickDistractors('A', undefined, [{ text: 'B', near: true }], 3, noRandom)).toEqual(['B']);
  });
});

describe('autoRating', () => {
  it('maps quiz results to ratings', () => {
    expect(autoRating(false, undefined, 1000, 5000)).toBe(1);
    expect(autoRating(true, undefined, 1000, 5000)).toBe(4);
    expect(autoRating(true, undefined, 9000, 5000)).toBe(3);
    expect(autoRating(true, 'typo', 1000, 5000)).toBe(3);
  });
});
