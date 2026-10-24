import { useCallback, useEffect, useState } from 'react';
import type { Lang, Settings } from '../types';

/**
 * Text-to-speech via the browser's Web Speech API. On iPhone this uses the
 * system (Siri) voices, so it works offline and costs nothing.
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Higher-quality voices ship under these names on Apple, Google and Microsoft platforms.
const PREFERRED = ['premium', 'enhanced', 'natural', 'neural', 'siri', 'google', 'samantha', 'daniel', 'ava', 'anna', 'karen'];

function voiceScore(voice: SpeechSynthesisVoice, lang: string): number {
  const vLang = voice.lang.replace('_', '-').toLowerCase();
  const want = lang.toLowerCase();
  let score = 0;
  if (vLang === want) score += 100;
  else if (vLang.split('-')[0] === want.split('-')[0]) score += 40;
  else return -1;
  const name = voice.name.toLowerCase();
  const rank = PREFERRED.findIndex((p) => name.includes(p));
  if (rank >= 0) score += 20 - rank;
  if (voice.localService) score += 5;
  return score;
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -1;
  for (const v of voices) {
    const s = voiceScore(v, lang);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

/** Makes card text pleasant to listen to: gaps become pauses, emoji and slashes are dropped. */
export function speakableText(text: string): string {
  return text
    .replace(/_{2,}/g, ' … ')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s\/\s/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveLang(lang: Lang, settings: Settings): string {
  return lang.startsWith('en') ? settings.englishAccent : lang;
}

function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (speechSupported ? speechSynthesis.getVoices() : []));
  useEffect(() => {
    if (!speechSupported) return;
    const update = () => setVoices(speechSynthesis.getVoices());
    update();
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

export function useSpeech(rate: number) {
  const voices = useVoices();
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  useEffect(() => () => {
    if (speechSupported) speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    if (!speechSupported) return;
    speechSynthesis.cancel();
    setSpeakingKey(null);
  }, []);

  /** `key` identifies the button that triggered playback, so only that one animates. */
  const speak = useCallback(
    (text: string, lang: string, key = text) => {
      if (!speechSupported) return;
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speakableText(text));
      utterance.lang = lang;
      utterance.rate = rate;
      const voice = pickVoice(voices, lang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => setSpeakingKey((k) => (k === key ? null : k));
      utterance.onerror = utterance.onend;
      setSpeakingKey(key);
      speechSynthesis.speak(utterance);
    },
    [rate, voices],
  );

  return { speak, stop, speakingKey, supported: speechSupported, voices };
}
