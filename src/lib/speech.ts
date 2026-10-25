import { useCallback, useEffect, useState } from 'react';
import type { Lang, Settings } from '../types';

/**
 * Text-to-speech via the browser's Web Speech API. On iPhone this uses the
 * system (Siri) voices, so it works offline and costs nothing.
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** iPhone and iPad, including iPads that report themselves as a Mac. */
export const isAppleTouch =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

let silence: HTMLAudioElement | null = null;
// True while the unlock utterance below is queued, so a real one can simply follow it.
let unlocking = false;

/** 0.1 s of silence as a WAV file, so no audio asset has to ship with the app. */
function silentWav(): string {
  const samples = 800;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true); // format chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true); // sample rate
  view.setUint32(28, 8000, true); // bytes per second
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  text(36, 'data');
  view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}

/**
 * Safari on iPhone plays speech on the "ambient" audio channel, which the
 * silent switch mutes. Asking for the media channel, and playing a silent clip
 * to make Safari switch to it, lets speech be heard like a video would.
 */
function primeAudio() {
  if (!isAppleTouch) return;
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = 'playback';
    } catch {
      // Older Safari: the silent clip below does the job.
    }
  }
  if (!silence) {
    silence = new Audio(silentWav());
    silence.setAttribute('playsinline', '');
  }
  silence.play().catch(() => {});
}

/**
 * iPhone only allows speech that starts from a tap. Speaking nothing on the
 * first tap anywhere unlocks it, so automatic reading works afterwards too.
 */
export function installSpeechUnlock() {
  if (!speechSupported || !isAppleTouch) return;
  const unlock = () => {
    window.removeEventListener('touchend', unlock, true);
    window.removeEventListener('click', unlock, true);
    primeAudio();
    if (!speechSynthesis.speaking) {
      const empty = new SpeechSynthesisUtterance(' ');
      empty.volume = 0;
      empty.onend = empty.onerror = () => (unlocking = false);
      unlocking = true;
      // In case Safari never reports the end of an empty utterance.
      window.setTimeout(() => (unlocking = false), 1000);
      speechSynthesis.speak(empty);
    }
  };
  window.addEventListener('touchend', unlock, true);
  window.addEventListener('click', unlock, true);
}

// Held so the playing utterance isn't garbage collected, which would drop its end event.
let currentUtterance: SpeechSynthesisUtterance | null = null;

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
    if (!speechSupported) return;
    currentUtterance = null;
    speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    if (!speechSupported) return;
    currentUtterance = null;
    speechSynthesis.cancel();
    setSpeakingKey(null);
  }, []);

  /** `key` identifies the button that triggered playback, so only that one animates. */
  const speak = useCallback(
    (text: string, lang: string, key = text) => {
      if (!speechSupported) return;
      const synth = window.speechSynthesis;
      primeAudio();
      const utterance = new SpeechSynthesisUtterance(speakableText(text));
      utterance.lang = lang;
      utterance.rate = rate;
      // iPhone lists voices that aren't downloaded and then stays silent. The
      // language alone picks the voice set under Gesprochene Inhalte, which always works.
      if (!isAppleTouch) {
        const voice = pickVoice(voices, lang);
        if (voice) utterance.voice = voice;
      }
      utterance.onend = () => {
        if (currentUtterance !== utterance) return;
        currentUtterance = null;
        setSpeakingKey((k) => (k === key ? null : k));
      };
      utterance.onerror = utterance.onend;
      currentUtterance = utterance;
      setSpeakingKey(key);
      if (synth.paused) synth.resume();
      if ((synth.speaking || synth.pending) && !unlocking) {
        // Safari drops an utterance queued in the same moment as cancel().
        synth.cancel();
        window.setTimeout(() => currentUtterance === utterance && synth.speak(utterance), 60);
      } else {
        synth.speak(utterance);
      }
    },
    [rate, voices],
  );

  return { speak, stop, speakingKey, supported: speechSupported, voices };
}
