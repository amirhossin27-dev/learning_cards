/** Gives every card of a list the same category. */
export const group = (tag, cards) => cards.map((c) => ({ ...c, tag }));
/**
 * Marks cards that join a built-in deck after its first release, so existing
 * installs receive them on their next start. `date` is the day they were
 * added (YYYY-MM-DD).
 */
export const added = (date, cards) => cards.map((c) => ({ ...c, added: date }));
