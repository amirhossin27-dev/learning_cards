import { describe, expect, it } from 'vitest';
import { answerVariants, autoRating, findCloze, normalize, pickDistractors, type Candidate } from './quiz';

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

  it('never offers another spelling of the right answer', () => {
    const picked = pickDistractors('(ein Meeting / Projekt) starten', undefined, [{ text: 'starten', near: true }, { text: 'beenden', near: true }], 3, noRandom);
    expect(picked).toEqual(['beenden']);
  });

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
  it('maps multiple choice results to ratings', () => {
    expect(autoRating(false, 1000)).toBe(1);
    expect(autoRating(true, 1000)).toBe(4);
    expect(autoRating(true, 9000)).toBe(3);
  });
});

describe('findCloze', () => {
  it('cuts the term out of its example sentence', () => {
    expect(findCloze('to kick off', "Let's kick off the meeting with a quick round of introductions.")).toEqual({
      before: "Let's ",
      gap: 'kick off',
      after: ' the meeting with a quick round of introductions.',
    });
  });

  it('finds common English forms and ignores case and bracketed hints', () => {
    expect(findCloze('to decide', 'We decided to wait.')?.gap).toBe('decided');
    expect(findCloze('to apply', 'She applied for the job.')?.gap).toBe('applied');
    expect(findCloze('to stop', 'They stopped the project.')?.gap).toBe('stopped');
    expect(findCloze('agenda (meeting)', 'The Agenda is ready.')?.gap).toBe('Agenda');
    expect(findCloze('deadline', 'The deadlines are tight.')?.gap).toBe('deadlines');
  });

  it('does not match inside other words or when the term is missing', () => {
    expect(findCloze('to be', 'It is because of you.')).toBeNull();
    expect(findCloze('agenda', 'Nothing to see here.')).toBeNull();
  });
});
