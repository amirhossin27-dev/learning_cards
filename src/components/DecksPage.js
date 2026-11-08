import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToday } from '../hooks/useToday';
import { deckStats, useAppData } from '../lib/store';
import { DeckEditor } from './DeckEditor';
import { DeckTile } from './DeckTile';
import { ImportDialog } from './ImportDialog';
export function DecksPage() {
    const { decks, cards } = useAppData();
    const { now, plan } = useToday();
    const [editing, setEditing] = useState(false);
    const [importing, setImporting] = useState(false);
    const byDeck = useMemo(() => {
        const map = new Map();
        for (const c of cards)
            map.set(c.deckId, [...(map.get(c.deckId) ?? []), c]);
        return map;
    }, [cards]);
    const todayByDeck = useMemo(() => {
        const map = new Map();
        for (const c of [...plan.due, ...plan.fresh])
            map.set(c.deckId, (map.get(c.deckId) ?? 0) + 1);
        return map;
    }, [plan]);
    return (_jsxs("div", { className: "page", children: [_jsxs("header", { className: "page-head", children: [_jsxs("div", { children: [_jsx("h1", { children: "Stapel" }), _jsxs("p", { className: "muted", children: [decks.length, " Stapel \u00B7 ", cards.length, " Karten"] })] }), _jsxs("div", { className: "page-head__actions", children: [_jsxs("button", { className: "btn btn--secondary", onClick: () => setImporting(true), children: [_jsx(Upload, { size: 17 }), " CSV importieren"] }), _jsxs("button", { className: "btn btn--primary", onClick: () => setEditing(true), children: [_jsx(Plus, { size: 17 }), " Neuer Stapel"] })] })] }), _jsxs("div", { className: "deck-grid", children: [decks.map((d) => (_jsx(DeckTile, { deck: d, stats: deckStats(byDeck.get(d.id) ?? [], now), today: todayByDeck.get(d.id) ?? 0 }, d.id))), _jsxs("button", { className: "deck-tile deck-tile--new", onClick: () => setEditing(true), children: [_jsx(Plus, { size: 20 }), _jsx("span", { children: "Neuer Stapel" })] })] }), editing && _jsx(DeckEditor, { onClose: () => setEditing(false) }), importing && _jsx(ImportDialog, { onClose: () => setImporting(false) })] }));
}
