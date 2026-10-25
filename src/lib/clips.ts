import clips from '../data/audioClips.json';

/**
 * Recorded pronunciations for the built-in decks. Unlike the browser's speech
 * output, recordings also play when the iPhone is in silent mode.
 * scripts/audio/README.md explains how they are made.
 */

const manifest: Record<string, string> = clips;

/** Languages that have recordings. Other languages always use the browser's voice. */
export const CLIP_LANGS = ['en-US', 'en-GB'] as const;

export function clipKey(lang: string, text: string): string {
  return `${lang}|${text}`;
}

/** URL of the recording for already speakable text, if there is one. */
export function clipUrl(lang: string, text: string): string | undefined {
  const id = manifest[clipKey(lang, text)];
  return id ? `./audio/${id}.mp3` : undefined;
}
