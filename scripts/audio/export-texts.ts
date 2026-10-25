// Lists every English text the app can speak for the built-in decks, in both
// accents, as input for generate.py. Run with `npm run audio:texts`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { builtInDecks } from '../../src/data/seed';
import { CLIP_LANGS, clipKey } from '../../src/lib/clips';
import { SAMPLE_SENTENCE, speakableText } from '../../src/lib/speech';

const english = new Set<string>([speakableText(SAMPLE_SENTENCE)]);
for (const deck of builtInDecks) {
  for (const card of deck.cards) {
    if (deck.frontLang.startsWith('en')) {
      english.add(speakableText(card.front));
      if (card.example) english.add(speakableText(card.example));
    }
    if (deck.backLang.startsWith('en')) english.add(speakableText(card.back));
  }
}
english.delete('');

const texts = CLIP_LANGS.flatMap((lang) => [...english].map((text) => ({ key: clipKey(lang, text), lang, text })));
const out = 'node_modules/.cache/audio';
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/texts.json`, JSON.stringify(texts, null, 1));
console.log(`${texts.length} texts → ${out}/texts.json`);
