import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToday } from '../hooks/useToday';
import { availableMethods } from '../lib/questions';
import { href } from '../lib/router';
import { useSpeech } from '../lib/speech';
import { addDays, endOfDay, isNew } from '../lib/srs';
import { deckStats, HARD_ROUND, hardCards, minutesFor, useAppData } from '../lib/store';
import { BoxBar } from './BoxBar';
import { DeckEditor } from './DeckEditor';
import { DeckTile } from './DeckTile';
import { GoalCard } from './GoalCard';
import { Heatmap } from './Heatmap';
import { ImportDialog } from './ImportDialog';
import { StudyLauncher } from './StudyLauncher';
const DATE = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
function greeting(now) {
    const h = new Date(now).getHours();
    if (h < 5)
        return 'Noch wach?';
    if (h < 11)
        return 'Guten Morgen';
    if (h < 17)
        return 'Hallo';
    if (h < 22)
        return 'Guten Abend';
    return 'Gute Nacht';
}
export function HomePage() {
    const { decks, cards, history, settings } = useAppData();
    const { supported } = useSpeech(settings.speechRate);
    const { now, plan, count, reviews, goal, streak } = useToday();
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
    const tomorrow = useMemo(() => {
        const from = endOfDay(now);
        const to = endOfDay(addDays(now, 1));
        return cards.filter((c) => !isNew(c) && (c.due ?? 0) > from && (c.due ?? 0) <= to).length;
    }, [cards, now]);
    const all = deckStats(cards, now);
    const hard = useMemo(() => Math.min(hardCards(cards).length, HARD_ROUND), [cards]);
    const methods = useMemo(() => availableMethods(cards, decks, supported), [cards, decks, supported]);
    // The big button: what is due, else new cards beyond today's budget, else free practice.
    const launch = cards.length === 0
        ? { route: null, title: 'Weiterlernen', subtitle: 'Leg zuerst einen Stapel mit Karten an' }
        : count > 0
            ? {
                route: { name: 'study' },
                title: 'Weiterlernen',
                subtitle: `${count} ${count === 1 ? 'Karte' : 'Karten'} · etwa ${minutesFor(count)} Min.`,
            }
            : all.fresh > 0
                ? {
                    route: { name: 'study', mode: 'new' },
                    title: 'Neue Karten lernen',
                    subtitle: `${all.fresh} neue ${all.fresh === 1 ? 'Karte wartet' : 'Karten warten'}`,
                }
                : {
                    route: { name: 'study', mode: 'extra' },
                    title: 'Frei üben',
                    subtitle: 'Zählt fürs Tagesziel, verschiebt keine Termine',
                    isPractice: true,
                };
    const goalCard = _jsx(GoalCard, { reviews: reviews, goal: goal, streak: streak });
    return (_jsxs("div", { className: "page today", children: [_jsxs("div", { className: "today__main", children: [_jsxs("section", { className: "today__hero", children: [_jsxs("p", { className: "eyebrow", children: [greeting(now), " \u00B7 ", DATE.format(now)] }), count > 0 ? (_jsxs(_Fragment, { children: [_jsxs("h1", { children: [_jsxs("mark", { children: [count, " ", count === 1 ? 'Karte' : 'Karten'] }), ' ', count === 1 ? 'ist' : 'sind', " heute dran"] }), _jsxs("p", { className: "today__sub", children: [[plan.due.length > 0 && `${plan.due.length} zum Wiederholen`, plan.fresh.length > 0 && `${plan.fresh.length} neu`]
                                                .filter(Boolean)
                                                .join(', '), todayByDeck.size > 1 && ` aus ${todayByDeck.size} Stapeln`, " \u00B7 etwa ", minutesFor(count), " Min."] })] })) : (_jsxs(_Fragment, { children: [_jsxs("h1", { children: ["Alles ", _jsx("mark", { children: "erledigt" }), " f\u00FCr heute"] }), _jsxs("p", { className: "today__sub", children: [reviews > 0 ? `Du hast heute ${reviews} ${reviews === 1 ? 'Karte' : 'Karten'} gelernt. ` : '', tomorrow > 0 ? `Morgen ${tomorrow === 1 ? 'ist 1 Karte' : `sind ${tomorrow} Karten`} fällig.` : 'Morgen ist nichts fällig.'] })] })), _jsx("div", { className: "only-narrow", children: goalCard }), _jsx(StudyLauncher, { ...launch, scope: { name: 'study' }, hard: hard, methods: methods, methodKey: "today", children: _jsxs("button", { type: "button", className: "launcher__chip hide-mobile", onClick: () => setImporting(true), children: [_jsx(Upload, { size: 15 }), " CSV importieren"] }) })] }), _jsxs("section", { children: [_jsxs("div", { className: "section-head", children: [_jsx("h2", { children: "Deine Stapel" }), _jsxs("a", { className: "section-head__link", href: href({ name: 'decks' }), children: [decks.length, " Stapel \u00B7 ", cards.length, " Karten"] })] }), _jsxs("div", { className: "deck-grid deck-grid--today", children: [decks.map((d) => (_jsx(DeckTile, { deck: d, stats: deckStats(byDeck.get(d.id) ?? [], now), today: todayByDeck.get(d.id) ?? 0 }, d.id))), _jsxs("button", { className: "deck-tile deck-tile--new", onClick: () => setEditing(true), children: [_jsx(Plus, { size: 20 }), _jsx("span", { children: "Neuer Stapel" })] })] }), _jsx("div", { className: "deck-list--today", children: decks.map((d) => (_jsx(DeckTile, { compact: true, deck: d, stats: deckStats(byDeck.get(d.id) ?? [], now), today: todayByDeck.get(d.id) ?? 0 }, d.id))) })] })] }), _jsxs("aside", { className: "today__rail", children: [_jsxs("section", { children: [_jsx("h3", { className: "rail-title", children: "Tagesziel" }), goalCard] }), _jsxs("section", { children: [_jsxs("h3", { className: "rail-title", children: ["Lernkalender ", _jsx("span", { children: "15 Wochen" })] }), _jsx(Heatmap, { history: history, goal: goal, weeks: 15, now: now })] }), _jsxs("section", { children: [_jsxs("h3", { className: "rail-title", children: ["Lernstand ", _jsxs("span", { children: [all.total, " Karten"] })] }), _jsx(BoxBar, { boxes: all.boxes, legend: true, size: "md" })] })] }), editing && _jsx(DeckEditor, { onClose: () => setEditing(false) }), importing && _jsx(ImportDialog, { onClose: () => setImporting(false) })] }));
}
