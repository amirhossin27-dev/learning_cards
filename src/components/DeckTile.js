import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DeckIcon } from '../lib/deckIcons';
import { href } from '../lib/router';
import { BoxBar } from './BoxBar';
/** A deck as an index card with a coloured tab, like a divider in a card box. */
export function DeckTile({ deck, stats, today, compact }) {
    // New cards beyond today's budget are still worth pointing out, so "erledigt" only means nothing is left at all.
    const status = today > 0 ? `${today} für heute` : stats.fresh > 0 ? `${stats.fresh} neu` : stats.total ? 'erledigt' : 'leer';
    return (_jsxs("a", { className: `deck-tile ${compact ? 'deck-tile--compact' : ''}`, href: href({ name: 'deck', id: deck.id }), "data-marker": deck.color % 6, children: [_jsx("i", { className: "tab", "aria-hidden": "true" }), _jsxs("div", { className: "deck-tile__head", children: [_jsx("strong", { children: deck.name }), compact ? (_jsx("span", { className: `deck-tile__due ${today > 0 ? 'is-due' : ''}`, children: status })) : (_jsx("span", { className: "deck-tile__icon", children: _jsx(DeckIcon, { name: deck.icon, size: 17 }) }))] }), !compact && _jsx("p", { children: deck.description }), _jsx(BoxBar, { boxes: stats.boxes }), !compact && (_jsxs("div", { className: "deck-tile__foot", children: [_jsxs("span", { children: [stats.total, " ", stats.total === 1 ? 'Karte' : 'Karten'] }), _jsx("span", { className: today > 0 ? 'is-due' : '', children: status })] }))] }));
}
