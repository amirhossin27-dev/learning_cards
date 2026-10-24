import { useEffect, useMemo, useState } from 'react';
import { newCardsLeft, planToday, reviewsOn, streak, useAppData } from '../lib/store';

/** Current time that refreshes every minute and whenever the app comes back to the foreground. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, []);
  return now;
}

/** Today's list across all decks plus goal and streak. */
export function useToday() {
  const data = useAppData();
  const now = useNow();
  return useMemo(() => {
    const order = data.decks.map((d) => d.id);
    const plan = planToday(data.cards, newCardsLeft(data, now), order, now);
    const reviews = reviewsOn(data.history, now);
    return {
      now,
      plan,
      count: plan.due.length + plan.fresh.length,
      reviews,
      goal: data.settings.dailyGoal,
      streak: streak(data.history, now),
    };
  }, [data, now]);
}
