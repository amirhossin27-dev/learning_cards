import { describe, expect, it } from 'vitest';
import clips from '../data/audioClips.json';
import { builtInDecks } from '../data/seed';
import { clipUrl } from './clips';
import { speakableText } from './speech';

describe('recordings', () => {
  it('has a file for every entry', () => {
    const files = new Set(Object.keys(import.meta.glob('../../public/audio/*.mp3')).map((path) => path.split('/').pop()));
    const missing = Object.values(clips).filter((id) => !files.has(`${id}.mp3`));
    expect(missing).toEqual([]);
  });

  it('covers the English side of the built-in decks in both accents', () => {
    const deck = builtInDecks.find((d) => d.frontLang.startsWith('en'))!;
    const text = speakableText(deck.cards[0].front);
    expect(clipUrl('en-US', text)).toMatch(/^\.\/audio\/[0-9a-f]{12}\.mp3$/);
    expect(clipUrl('en-GB', text)).toMatch(/^\.\/audio\/[0-9a-f]{12}\.mp3$/);
    expect(clipUrl('en-US', text)).not.toBe(clipUrl('en-GB', text));
  });

  it('has none for German or unknown text', () => {
    expect(clipUrl('de-DE', 'Besprechung')).toBeUndefined();
    expect(clipUrl('en-US', 'a sentence nobody recorded')).toBeUndefined();
  });
});
