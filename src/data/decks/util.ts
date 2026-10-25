import type { SeedCard } from '../seed';

/** Gives every card of a list the same category. */
export const group = (tag: string, cards: Omit<SeedCard, 'tag'>[]): SeedCard[] => cards.map((c) => ({ ...c, tag }));

/**
 * Marks cards that join a built-in deck after its first release, so existing
 * installs receive them on their next start. `date` is the day they were
 * added (YYYY-MM-DD).
 */
export const added = (date: string, cards: SeedCard[]): SeedCard[] => cards.map((c) => ({ ...c, added: date }));
