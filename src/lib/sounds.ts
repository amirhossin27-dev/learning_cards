/**
 * The two short tones for a right and a wrong answer ("Glöckchen sanft"):
 * two soft notes going up, and one low muffled note going slightly down.
 *
 * They are computed here instead of loaded from files, so they are there
 * offline and start without delay. Played through Web Audio, which on iPhone
 * follows the silent switch like other interface sounds, and allows a volume.
 */

export type SoundLevel = 'off' | 'quiet' | 'normal';
export type Tone = 'right' | 'wrong';

export const SOUND_LEVELS: { value: SoundLevel; label: string }[] = [
  { value: 'off', label: 'Aus' },
  { value: 'quiet', label: 'Leise' },
  { value: 'normal', label: 'Normal' },
];

const VOLUME: Record<SoundLevel, number> = { off: 0, quiet: 0.45, normal: 1 };

interface Note {
  /** Start in seconds. */
  at: number;
  freq: number;
  duration: number;
  /** Time constant of the fade: larger rings longer. */
  decay: number;
  /** Pitch change over the note, as a share of the frequency (negative = down). */
  bend?: number;
}

interface Recipe {
  notes: Note[];
  duration: number;
  /** Frequency above which the sound is muffled. */
  cutoff: number;
  peak: number;
}

const RECIPES: Record<Tone, Recipe> = {
  right: {
    notes: [
      { at: 0, freq: 523.25, duration: 0.4, decay: 0.28 },
      { at: 0.08, freq: 783.99, duration: 0.45, decay: 0.32 },
    ],
    duration: 0.55,
    cutoff: 2600,
    peak: 0.3,
  },
  wrong: {
    notes: [{ at: 0, freq: 261.63, duration: 0.38, decay: 0.24, bend: -0.05 }],
    duration: 0.42,
    cutoff: 700,
    peak: 0.24,
  },
};

/** The fundamental and a quiet octave above it that fades faster. */
const PARTIALS: [multiple: number, level: number][] = [
  [1, 1],
  [2, 0.12],
];
const ATTACK = 0.008;
const FADE_OUT = 0.01;

/** The samples of a tone (mono, -1 to 1). */
export function renderTone(tone: Tone, sampleRate: number): Float32Array {
  const recipe = RECIPES[tone];
  const out = new Float32Array(Math.round(recipe.duration * sampleRate));
  for (const note of recipe.notes) {
    const start = Math.round(note.at * sampleRate);
    const length = Math.min(Math.round(note.duration * sampleRate), out.length - start);
    let phase = 0;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = note.freq * (1 + ((note.bend ?? 0) * t) / note.duration);
      phase += (2 * Math.PI * freq) / sampleRate;
      const envelope = Math.min(1, t / ATTACK) * Math.exp((-t / note.decay) * 3);
      let value = 0;
      for (const [multiple, level] of PARTIALS) {
        // Muffling: the higher a partial lies above the cutoff, the quieter it is.
        const muffled = level / (1 + ((freq * multiple) / recipe.cutoff) ** 4);
        value += muffled * Math.sin(multiple * phase) * Math.exp(-t * (multiple - 1) * 12);
      }
      out[start + i] += value * envelope;
    }
  }
  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  const fade = Math.round(FADE_OUT * sampleRate);
  for (let i = 0; i < out.length; i++) {
    const tail = out.length - i;
    out[i] = (out[i] / (max || 1)) * recipe.peak * (tail < fade ? tail / fade : 1);
  }
  return out;
}

type AudioContextClass = typeof AudioContext;
let context: AudioContext | null = null;
const buffers: Partial<Record<Tone, AudioBuffer>> = {};

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor: AudioContextClass | undefined =
    typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext);
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/**
 * Plays the tone for a right or wrong answer. Call it from the tap or key
 * press that gave the answer: browsers only start sound from there.
 */
export function playTone(tone: Tone, level: SoundLevel | undefined = 'normal') {
  if (level === 'off') return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    // Safari suspends the context until a tap, and again after the app was in the background.
    if (ctx.state !== 'running') void ctx.resume();
    let buffer = buffers[tone];
    if (!buffer) {
      const samples = renderTone(tone, ctx.sampleRate);
      buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.getChannelData(0).set(samples);
      buffers[tone] = buffer;
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = VOLUME[level] ?? 1;
    source.buffer = buffer;
    source.connect(gain).connect(ctx.destination);
    source.start();
  } catch {
    // No sound is never a reason to interrupt learning.
  }
}
