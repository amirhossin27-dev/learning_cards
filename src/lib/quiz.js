export const METHODS = [
    { value: 'flip', label: 'Karte' },
    { value: 'choice', label: 'Auswahl' },
    { value: 'cloze', label: 'Lückentext' },
    { value: 'listen', label: 'Hören' },
    { value: 'pairs', label: 'Paare' },
    { value: 'truefalse', label: 'Richtig/Falsch' },
];
export const isMethod = (value) => METHODS.some((m) => m.value === value);
const UMLAUTS = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
/**
 * Lower case, umlauts spelled out (so "Muenchen" equals "München"), other
 * accents dropped, punctuation and extra spaces removed.
 */
export function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[äöüß]/g, (c) => UMLAUTS[c])
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}
/** Splits at commas, semicolons and slashes that are not inside brackets. */
function splitTopLevel(text) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of text) {
        if (ch === '(' || ch === '[')
            depth++;
        else if ((ch === ')' || ch === ']') && depth > 0)
            depth--;
        if (depth === 0 && (ch === ',' || ch === ';' || ch === '/')) {
            parts.push(current);
            current = '';
        }
        else
            current += ch;
    }
    parts.push(current);
    return parts.map((p) => p.trim()).filter(Boolean);
}
const withoutBrackets = (text) => text.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');
const LEADING_WORD = /^(to|the|a|an|der|die|das|ein|eine|le|la|les|el|los|las|il|lo|gli)\s+/;
const words = (text) => normalize(text).split(' ').filter(Boolean).length;
/**
 * All spellings of an answer, normalized, so a wrong option is never just
 * another way of writing the right one. "(ein Meeting / Projekt) starten"
 * also accepts "starten", "to kick off" also "kick off", and a list of short
 * synonyms like "Tagesordnung, Agenda" accepts each one.
 */
export function answerVariants(answer) {
    const out = new Set();
    const add = (text) => {
        const n = normalize(text);
        if (!n)
            return;
        out.add(n);
        const bare = n.replace(LEADING_WORD, '');
        if (bare)
            out.add(bare);
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
/**
 * Picks wrong answers for a multiple choice question: from the same deck
 * first, preferably with the same tag and a similar length, never twice the
 * same text and never something that counts as the right answer.
 */
export function pickDistractors(answer, tag, candidates, count = 3, random = Math.random) {
    const right = new Set(answerVariants(answer));
    right.add(normalize(answer));
    const seen = new Set();
    const scored = [];
    for (const c of candidates) {
        const key = normalize(c.text);
        if (!key || right.has(key) || seen.has(key))
            continue;
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
/** A vocabulary term as it is looked for in a sentence: without "to" and bracketed hints. */
export function bareTerm(term) {
    return withoutBrackets(term).replace(/^\s*to\s+/i, '').replace(/\s+/g, ' ').trim();
}
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** One word of a term, also in its common English forms ("decide" → decides, decided, deciding). */
function wordPattern(word) {
    if (/[^aeiou]y$/i.test(word))
        return `${escapeRe(word.slice(0, -1))}(?:y|ies|ied|ying)`;
    if (/[^e]e$/i.test(word) && word.length > 2)
        return `${escapeRe(word.slice(0, -1))}(?:e|es|ed|ing)`;
    const last = escapeRe(word.slice(-1));
    return `${escapeRe(word)}(?:s|es|ed|ing|${last}ed|${last}ing)?`;
}
/**
 * Finds a term in its example sentence so it can be cut out: "to kick off" in
 * "Let's kick off the meeting", also as "kicked off". Null when the sentence
 * doesn't contain it (or the term is too long to make a good gap).
 */
export function findCloze(term, sentence) {
    const bare = bareTerm(term);
    const parts = bare.split(' ').filter(Boolean);
    if (!bare || bare.length < 2 || parts.length > 5)
        return null;
    const pattern = new RegExp(`(?<![\\p{L}])${parts.map(wordPattern).join('\\s+')}(?![\\p{L}])`, 'iu');
    const match = pattern.exec(sentence);
    if (!match)
        return null;
    return { before: sentence.slice(0, match.index), gap: match[0], after: sentence.slice(match.index + match[0].length) };
}
/** Pairs need short texts on both sides so five of them fit on a phone screen. */
export const PAIR_MAX_LENGTH = 40;
export const PAIR_COUNT = 5;
/** Time in ms under which a right answer counts as "Leicht". */
export const FAST_ANSWER = 5_000;
/** Turns a quiz result into one of the four ratings of the schedule. */
export function autoRating(correct, elapsed, limit = FAST_ANSWER) {
    if (!correct)
        return 1;
    return elapsed < limit ? 4 : 3;
}
