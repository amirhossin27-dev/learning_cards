import { useEffect, useState } from 'react';

/** Counts from 0 up to `target` once, unless the user prefers reduced motion. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0));
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}
