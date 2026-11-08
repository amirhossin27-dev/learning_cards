import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Target } from 'lucide-react';
import { useMemo } from 'react';
import { useToday } from '../hooks/useToday';
import { href } from '../lib/router';
import { addDays, dayKey, endOfDay, isNew, startOfDay } from '../lib/srs';
import { deckStats, HARD_ROUND, hardCards, useAppData } from '../lib/store';
import { BoxBar } from './BoxBar';
import { Heatmap } from './Heatmap';
const WEEKDAY = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });
/** Cards due on each of the next seven days (today includes everything overdue). */
function forecast(cards, now) {
    const days = Array.from({ length: 7 }, (_, i) => {
        const day = addDays(startOfDay(now), i);
        return { day, label: i === 0 ? 'Heute' : i === 1 ? 'Morgen' : WEEKDAY.format(day), count: 0 };
    });
    for (const c of cards) {
        if (isNew(c) || c.due === undefined)
            continue;
        const i = days.findIndex((d) => c.due <= endOfDay(d.day));
        if (i >= 0)
            days[i].count++;
    }
    return days;
}
export function StatsPage() {
    const { decks, cards, history } = useAppData();
    const { now, reviews, goal, streak } = useToday();
    const week = useMemo(() => {
        let sum = 0;
        for (let i = 0; i < 7; i++)
            sum += history[dayKey(addDays(now, -i))]?.reviews ?? 0;
        return sum;
    }, [history, now]);
    const activeDays = useMemo(() => Object.values(history).filter((d) => d.reviews > 0).length, [history]);
    const all = deckStats(cards, now);
    const days = useMemo(() => forecast(cards, now), [cards, now]);
    const max = Math.max(1, ...days.map((d) => d.count));
    const hard = useMemo(() => hardCards(cards), [cards]);
    const hardest = hard.slice(0, 8);
    return (_jsxs("div", { className: "page stats", children: [_jsx("header", { className: "page-head", children: _jsxs("div", { children: [_jsx("h1", { children: "Statistik" }), _jsx("p", { className: "muted", children: activeDays > 0 ? `An ${activeDays} ${activeDays === 1 ? 'Tag' : 'Tagen'} gelernt` : 'Noch keine Lerntage' })] }) }), _jsxs("div", { className: "stat-tiles", children: [_jsxs("div", { className: "stat-tile", children: [_jsx("span", { children: "Lernserie" }), _jsx("strong", { children: streak }), _jsx("small", { children: streak === 1 ? 'Tag in Folge' : 'Tage in Folge' })] }), _jsxs("div", { className: "stat-tile", children: [_jsx("span", { children: "Heute" }), _jsx("strong", { children: reviews }), _jsxs("small", { children: ["von ", goal, " Karten"] })] }), _jsxs("div", { className: "stat-tile", children: [_jsx("span", { children: "Letzte 7 Tage" }), _jsx("strong", { children: week }), _jsx("small", { children: "Antworten" })] }), _jsxs("div", { className: "stat-tile", children: [_jsx("span", { children: "Gemeistert" }), _jsx("strong", { children: all.mastered }), _jsxs("small", { children: ["von ", all.total, " Karten"] })] })] }), _jsxs("div", { className: "stats__grid", children: [_jsxs("section", { className: "panel", children: [_jsx("h2", { className: "panel__title", children: "Lernkalender" }), _jsx(Heatmap, { history: history, goal: goal, weeks: 20, now: now })] }), _jsxs("section", { className: "panel", children: [_jsx("h2", { className: "panel__title", children: "F\u00E4llig in den n\u00E4chsten 7 Tagen" }), _jsx("div", { className: "forecast", role: "list", children: days.map((d) => (_jsxs("div", { className: "forecast__col", role: "listitem", "aria-label": `${d.label}: ${d.count} Karten`, children: [_jsx("span", { className: "forecast__value", children: d.count }), _jsx("div", { className: "forecast__track", children: _jsx("i", { style: { height: `${(d.count / max) * 100}%` } }) }), _jsx("span", { className: "forecast__label", children: d.label })] }, d.day))) }), _jsx("p", { className: "panel__note", children: "Ohne neue Karten. Davon kommen t\u00E4glich so viele dazu, wie du in den Einstellungen festlegst." })] }), _jsxs("section", { className: "panel panel--wide", children: [_jsx("h2", { className: "panel__title", children: "Lernstand pro Stapel" }), _jsx("ul", { className: "deck-progress", children: decks.map((d) => {
                                    const s = deckStats(cards.filter((c) => c.deckId === d.id), now);
                                    return (_jsxs("li", { "data-marker": d.color % 6, children: [_jsxs("a", { href: href({ name: 'deck', id: d.id }), children: [_jsx("i", { className: "marker-tab", "aria-hidden": "true" }), _jsx("strong", { children: d.name }), _jsxs("span", { children: [s.mastered, " von ", s.total, " gemeistert"] })] }), _jsx(BoxBar, { boxes: s.boxes, size: "md" })] }, d.id));
                                }) }), _jsx(BoxBar, { boxes: all.boxes, legend: true, size: "md" })] }), _jsxs("section", { className: "panel panel--wide", children: [_jsxs("div", { className: "panel__head", children: [_jsx("h2", { className: "panel__title", children: "Schwierigste Karten" }), hard.length > 0 && (_jsxs("a", { className: "btn btn--secondary btn--sm", href: href({ name: 'study', mode: 'hard' }), children: [_jsx(Target, { size: 16 }), " ", Math.min(hard.length, HARD_ROUND), " \u00FCben"] }))] }), hardest.length === 0 ? (_jsx("p", { className: "panel__note", children: "Noch keine. Hier landen Karten, die du zuletzt falsch beantwortet oder nach dem Lernen wieder vergessen hast." })) : (_jsx("ul", { className: "hard-list", children: hardest.map((c) => (_jsxs("li", { children: [_jsxs("a", { href: href({ name: 'deck', id: c.deckId }), children: [_jsx("strong", { children: c.front }), _jsx("span", { children: c.back })] }), _jsx("em", { children: (c.lapses ?? 0) > 0 ? `${c.lapses}× vergessen` : 'zuletzt falsch' })] }, c.id))) }))] })] })] }));
}
