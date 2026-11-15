import { describe, expect, it } from 'vitest';
import { renderTone } from './sounds';

describe('renderTone', () => {
  it('renders short, quiet tones without clicks at the ends', () => {
    for (const tone of ['right', 'wrong'] as const) {
      const samples = renderTone(tone, 44100);
      const peak = samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
      expect(samples.length / 44100).toBeLessThan(0.6);
      expect(peak).toBeGreaterThan(0.2);
      expect(peak).toBeLessThanOrEqual(0.3001);
      expect(Math.abs(samples[0])).toBeLessThan(0.01);
      expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.01);
      expect(samples.some((v) => Number.isNaN(v))).toBe(false);
    }
  });

  it('makes the wrong tone lower and quieter than the right one', () => {
    const crossings = (s: Float32Array) => s.reduce((n, v, i) => n + (i > 0 && v >= 0 !== s[i - 1] >= 0 ? 1 : 0), 0) / s.length;
    const peak = (s: Float32Array) => s.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
    const right = renderTone('right', 44100);
    const wrong = renderTone('wrong', 44100);
    expect(crossings(wrong)).toBeLessThan(crossings(right));
    expect(peak(wrong)).toBeLessThan(peak(right));
  });
});
