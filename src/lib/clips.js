import clips from '../data/audioClips.json';
/**
 * Recorded pronunciations for the built-in decks. Unlike the browser's speech
 * output, recordings also play when the iPhone is in silent mode.
 * scripts/audio/README.md explains how they are made.
 */
const manifest = clips;
/** Languages that have recordings. Other languages always use the browser's voice. */
export const CLIP_LANGS = ['en-US', 'en-GB'];
export function clipKey(lang, text) {
    return `${lang}|${text}`;
}
/** URL of the recording for already speakable text, if there is one. */
export function clipUrl(lang, text) {
    const id = manifest[clipKey(lang, text)];
    return id ? `./audio/${id}.mp3` : undefined;
}
