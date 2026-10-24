import { describe, expect, it } from 'vitest';
import { exportCsv, importCsv, parseCsv } from './csv';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, CRLF and BOM', () => {
    const rows = parseCsv('﻿a,"b, c"\r\n"say ""hi""",d\r\n');
    expect(rows).toEqual([
      ['a', 'b, c'],
      ['say "hi"', 'd'],
    ]);
  });

  it('detects semicolon delimiters from German Excel', () => {
    expect(parseCsv('Frage;Antwort\nHund;dog')).toEqual([
      ['Frage', 'Antwort'],
      ['Hund', 'dog'],
    ]);
  });

  it('keeps multi-line quoted cells', () => {
    expect(parseCsv('"line 1\nline 2",x')).toEqual([['line 1\nline 2', 'x']]);
  });
});

describe('importCsv', () => {
  it('reads two-column files without a header', () => {
    const r = importCsv('reliable,zuverlässig \nsurvey,Umfrage\n');
    expect(r.hasHeader).toBe(false);
    expect(r.cards).toEqual([
      { front: 'reliable', back: 'zuverlässig' },
      { front: 'survey', back: 'Umfrage' },
    ]);
  });

  it('collapses reversed pairs into one card', () => {
    const csv = [
      'to ramp,"ausführen, hochfahren"',
      '"ausführen, hochfahren",to ramp',
      'consistency,Konsistenz',
      'Konsistenz,consistency',
      'Vertraulichkeit , Confidentiality',
      ' Confidentiality,Vertraulichkeit ',
    ].join('\n');
    const r = importCsv(csv);
    expect(r.cards.map((c) => c.front)).toEqual(['to ramp', 'consistency', 'Vertraulichkeit']);
    expect(r.reversedSkipped).toBe(3);
  });

  it('merges a repeated front with a longer answer', () => {
    const csv = [
      'compliance,Einhaltung',
      'Einhaltung,compliance',
      'compliance,Einhaltung / Rechtstreue / Regelkonformität',
      'Einhaltung / Rechtstreue / Regelkonformität,compliance',
    ].join('\n');
    const r = importCsv(csv);
    expect(r.cards).toEqual([{ front: 'compliance', back: 'Einhaltung / Rechtstreue / Regelkonformität' }]);
    expect(r.duplicatesMerged).toBe(1);
    expect(r.reversedSkipped).toBe(2);
  });

  it('maps header aliases in any column order', () => {
    const r = importCsv('Thema;Antwort;Frage;Eselsbrücke\nGeo;Paris;Hauptstadt Frankreich?;P wie Paris');
    expect(r.hasHeader).toBe(true);
    expect(r.cards).toEqual([{ front: 'Hauptstadt Frankreich?', back: 'Paris', note: 'P wie Paris', tag: 'Geo' }]);
  });

  it('skips rows with an empty side', () => {
    const r = importCsv('a,b\nc,\n,d\n');
    expect(r.cards).toHaveLength(1);
    expect(r.emptySkipped).toBe(2);
  });
});

describe('exportCsv', () => {
  it('round-trips through importCsv', () => {
    const cards = [
      { front: 'to follow up', back: 'nachfassen', example: 'I\'ll follow up, "asap".', note: 'Line 1\nLine 2', tag: 'E-Mail' },
      { front: 'deadline', back: 'Frist' },
    ];
    const csv = exportCsv(cards);
    expect(csv.startsWith('﻿front,back,example,note,tag')).toBe(true);
    expect(importCsv(csv).cards).toEqual(cards);
  });
});
