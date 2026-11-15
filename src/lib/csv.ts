/**
 * CSV import/export for flashcards.
 *
 * Import is deliberately forgiving: it accepts files with or without a header
 * row, comma / semicolon / tab delimiters (German Excel uses semicolons), a
 * UTF-8 BOM, quoted fields and stray whitespace. Files that list every pair
 * twice (A→B and B→A, a common pattern in vocabulary exports) are collapsed to
 * one card per pair, because the study mode can quiz both directions anyway.
 */

export interface ParsedCard {
  front: string;
  back: string;
  example?: string;
  note?: string;
  tag?: string;
  /** The words of the example sentence that are cut out as the gap. */
  gap?: string;
  /** Fixed wrong answers for multiple choice and true or false. */
  wrong?: string[];
  /** Fixed wrong answers for the gap. */
  wrongGap?: string[];
}

export interface ImportResult {
  cards: ParsedCard[];
  delimiter: string;
  hasHeader: boolean;
  /** Rows dropped because they were the reverse of an earlier row. */
  reversedSkipped: number;
  /** Rows merged into an earlier card with the same front. */
  duplicatesMerged: number;
  /** Rows dropped because front or back was empty. */
  emptySkipped: number;
}

type Field = keyof ParsedCard;

const HEADER_ALIASES: Record<Field, string[]> = {
  front: ['front', 'frage', 'question', 'vorderseite', 'begriff', 'term', 'word', 'wort', 'englisch', 'english'],
  back: ['back', 'antwort', 'answer', 'rückseite', 'rueckseite', 'bedeutung', 'meaning', 'translation', 'übersetzung', 'uebersetzung', 'deutsch', 'german'],
  example: ['example', 'beispiel', 'beispielsatz', 'sentence'],
  note: ['note', 'notes', 'notiz', 'hinweis', 'eselsbrücke', 'eselsbruecke', 'mnemonic', 'tipp'],
  tag: ['tag', 'tags', 'kategorie', 'category', 'thema', 'topic'],
  gap: ['gap', 'lücke', 'luecke', 'cloze'],
  wrong: ['wrong', 'falsch', 'falsche antworten', 'wrong answers', 'distractors'],
  wrongGap: ['wrong_gap', 'wrong gap', 'falsch_lücke', 'falsch_luecke', 'falsche lücke', 'falsche luecke'],
};

/** Several wrong answers share one cell, separated by " | ". */
const LIST_SEPARATOR = ' | ';
const splitList = (cell: string) => cell.split('|').map((s) => s.trim()).filter(Boolean);

export function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 20);
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestScore = -1;
  for (const d of candidates) {
    let score = 0;
    for (const line of sample) {
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === d && !inQuotes) score++;
      }
    }
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

/** RFC 4180 parser. Returns rows of raw (untrimmed) cells. */
export function parseCsv(input: string, delimiter = detectDelimiter(input)): string[][] {
  const text = input.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell.trim() === '') {
      cell = '';
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** "Einhaltung / Rechtstreue, Konformität" → ["einhaltung / rechtstreue, konformität", "einhaltung", "rechtstreue", "konformität"] */
const answerParts = (s: string) => [normalize(s), ...s.split(/[/,;]/).map(normalize).filter(Boolean)];

function mapHeader(row: string[]): Partial<Record<Field, number>> | null {
  const map: Partial<Record<Field, number>> = {};
  row.forEach((cell, index) => {
    const key = normalize(cell);
    for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
      if (map[field] === undefined && HEADER_ALIASES[field].includes(key)) {
        map[field] = index;
      }
    }
  });
  return map.front !== undefined && map.back !== undefined ? map : null;
}

/** Joins two answers for the same front, keeping the longer one if it already contains the other. */
function mergeAnswers(a: string, b: string): string {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.includes(nb)) return a;
  if (nb.includes(na)) return b;
  return `${a} / ${b}`;
}

export function importCsv(text: string): ImportResult {
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  const header = rows.length > 0 ? mapHeader(rows[0]) : null;
  const columns: Partial<Record<Field, number>> = header ?? { front: 0, back: 1, example: 2, note: 3, tag: 4 };
  const body = header ? rows.slice(1) : rows;

  const cards: ParsedCard[] = [];
  const byFront = new Map<string, ParsedCard>();
  let reversedSkipped = 0;
  let duplicatesMerged = 0;
  let emptySkipped = 0;

  const get = (row: string[], field: Field) => {
    const index = columns[field];
    if (index === undefined) return '';
    return (row[index] ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/[ \t]+/g, ' '))
      .join('\n')
      .trim();
  };

  for (const row of body) {
    const front = get(row, 'front');
    const back = get(row, 'back');
    if (!front || !back) {
      emptySkipped++;
      continue;
    }

    const reverse = byFront.get(normalize(back));
    if (reverse && answerParts(reverse.back).includes(normalize(front))) {
      reversedSkipped++;
      continue;
    }

    const existing = byFront.get(normalize(front));
    if (existing) {
      existing.back = mergeAnswers(existing.back, back);
      duplicatesMerged++;
      continue;
    }

    const card: ParsedCard = { front, back };
    const example = get(row, 'example');
    const note = get(row, 'note');
    const tag = get(row, 'tag');
    if (example) card.example = example;
    if (note) card.note = note;
    if (tag) card.tag = tag;
    // Only files with a header row carry these, so a sixth column in a plain list is never taken for a gap.
    if (header) {
      const gap = get(row, 'gap');
      const wrong = splitList(get(row, 'wrong'));
      const wrongGap = splitList(get(row, 'wrongGap'));
      if (gap) card.gap = gap;
      if (wrong.length) card.wrong = wrong;
      if (wrongGap.length) card.wrongGap = wrongGap;
    }
    cards.push(card);
    byFront.set(normalize(front), card);
  }

  return { cards, delimiter, hasHeader: header !== null, reversedSkipped, duplicatesMerged, emptySkipped };
}

function escapeCell(value: string | undefined, delimiter: string): string {
  const v = value ?? '';
  return /["\r\n]/.test(v) || v.includes(delimiter) || v !== v.trim() ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Serialises cards with a header row. A BOM is prepended so Excel shows umlauts correctly. */
export function exportCsv(cards: ParsedCard[], delimiter = ','): string {
  const header = ['front', 'back', 'example', 'note', 'tag'];
  // The gap and the fixed wrong answers only get columns when a card has them, so plain decks keep their five columns.
  const extra = cards.some((c) => c.gap || c.wrong?.length || c.wrongGap?.length);
  if (extra) header.push('gap', 'wrong', 'wrong_gap');
  const lines = [header.join(delimiter)];
  for (const c of cards) {
    const cells = [c.front, c.back, c.example, c.note, c.tag];
    if (extra) cells.push(c.gap, c.wrong?.join(LIST_SEPARATOR), c.wrongGap?.join(LIST_SEPARATOR));
    lines.push(cells.map((v) => escapeCell(v, delimiter)).join(delimiter));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}
