import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ArrowLeft, Download, Ellipsis, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { exportCsv } from '../lib/csv';
import { downloadText, slugify } from '../lib/download';
import { availableMethods } from '../lib/questions';
import { href, navigate } from '../lib/router';
import { resolveLang, useSpeech } from '../lib/speech';
import { useNow } from '../hooks/useToday';
import { DeckIcon } from '../lib/deckIcons';
import { BOX_COUNT, BOX_LABELS, DAY, endOfDay, isDue, isNew } from '../lib/srs';
import { actions, deckStats, HARD_ROUND, hardCards, minutesFor, newCardsLeft, planToday, useAppData } from '../lib/store';
import { BoxBar } from './BoxBar';
import { CardEditor } from './CardEditor';
import { DeckEditor } from './DeckEditor';
import { ImportDialog } from './ImportDialog';
import { Modal } from './Modal';
import { SpeakButton } from './SpeakButton';
import { StudyLauncher } from './StudyLauncher';
import { toast } from './Toast';
function BoxDots({ box }) {
    return (_jsx("span", { className: "box-dots", title: BOX_LABELS[box], "aria-label": BOX_LABELS[box], children: Array.from({ length: BOX_COUNT }, (_, i) => (_jsx("i", { className: i <= box ? 'is-on' : '' }, i))) }));
}
function dueLabel(card, now) {
    if (isNew(card))
        return 'neu';
    if (isDue(card, now))
        return 'fällig';
    const days = Math.ceil(((card.due ?? 0) - endOfDay(now)) / DAY);
    return days <= 1 ? 'morgen' : `in ${days} Tagen`;
}
export function DeckPage({ deckId }) {
    const data = useAppData();
    const { decks, cards, settings } = data;
    const now = useNow();
    const deck = decks.find((d) => d.id === deckId);
    const deckCards = useMemo(() => cards.filter((c) => c.deckId === deckId), [cards, deckId]);
    const tags = useMemo(() => [...new Set(deckCards.map((c) => c.tag).filter(Boolean))], [deckCards]);
    const [query, setQuery] = useState('');
    const [tag, setTag] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menu = useRef(null);
    const { speak, speakingKey, supported } = useSpeech(settings.speechRate);
    useEffect(() => {
        if (!menuOpen)
            return;
        const close = (e) => !menu.current?.contains(e.target) && setMenuOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [menuOpen]);
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return deckCards.filter((c) => (!tag || c.tag === tag) &&
            (!q || c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q) || c.example?.toLowerCase().includes(q)));
    }, [deckCards, query, tag]);
    if (!deck) {
        return (_jsxs("div", { className: "empty", children: [_jsx("p", { children: "Diesen Stapel gibt es nicht." }), _jsx("a", { className: "btn btn--primary", href: href({ name: 'home' }), children: "Zur \u00DCbersicht" })] }));
    }
    const stats = deckStats(deckCards, now);
    const tagCards = tag ? deckCards.filter((c) => c.tag === tag) : deckCards;
    const tagPlan = planToday(tagCards, newCardsLeft(data, now), [], now);
    const todayCount = tagPlan.due.length + tagPlan.fresh.length;
    const tagNew = tagCards.filter(isNew).length;
    const scope = { name: 'study', id: deck.id, tag: tag ?? undefined };
    const hard = Math.min(hardCards(tagCards).length, HARD_ROUND);
    const methods = availableMethods(tagCards, decks, supported);
    const what = tag ? `${tag} lernen` : 'Weiterlernen';
    // The big button: what is due, else new cards beyond today's budget, else free practice.
    const launch = tagCards.length === 0
        ? { route: null, title: what, subtitle: 'Leg zuerst ein paar Karten an' }
        : todayCount > 0
            ? {
                route: scope,
                title: what,
                subtitle: `${todayCount} ${todayCount === 1 ? 'Karte' : 'Karten'} heute dran · etwa ${minutesFor(todayCount)} Min.`,
            }
            : tagNew > 0
                ? {
                    route: { ...scope, mode: 'new' },
                    title: 'Neue Karten lernen',
                    subtitle: `Für heute erledigt · ${tagNew} neue ${tagNew === 1 ? 'Karte wartet' : 'Karten warten'}`,
                }
                : {
                    route: { ...scope, mode: 'extra' },
                    title: 'Frei üben',
                    subtitle: 'Für heute erledigt · verschiebt keine Termine',
                    isPractice: true,
                };
    const exportDeck = () => {
        setMenuOpen(false);
        downloadText(`${slugify(deck.name)}.csv`, exportCsv(deckCards));
        toast(`${deckCards.length} Karten exportiert`);
    };
    const menuItem = (icon, label, onClick, danger = false) => {
        const Icon = icon;
        return (_jsxs("button", { className: `menu__item ${danger ? 'menu__item--danger' : ''}`, onClick: () => {
                setMenuOpen(false);
                onClick();
            }, children: [_jsx(Icon, { size: 16 }), " ", label] }));
    };
    return (_jsxs("div", { className: "page", children: [_jsxs("a", { className: "back-link", href: href({ name: 'decks' }), children: [_jsx(ArrowLeft, { size: 18 }), " Alle Stapel"] }), _jsxs("section", { className: "deck-hero", "data-marker": deck.color % 6, children: [_jsx("i", { className: "tab", "aria-hidden": "true" }), _jsxs("div", { className: "menu deck-hero__menu", ref: menu, children: [_jsx("button", { className: "icon-btn", onClick: () => setMenuOpen((o) => !o), "aria-label": "Weitere Aktionen", "aria-expanded": menuOpen, children: _jsx(Ellipsis, { size: 20 }) }), menuOpen && (_jsxs("div", { className: "menu__panel", role: "menu", children: [menuItem(Pencil, 'Stapel bearbeiten', () => setDialog({ kind: 'deck' })), menuItem(Upload, 'CSV importieren', () => setDialog({ kind: 'import' })), _jsxs("button", { className: "menu__item", onClick: exportDeck, disabled: deckCards.length === 0, children: [_jsx(Download, { size: 16 }), " CSV exportieren"] }), menuItem(RotateCcw, 'Fortschritt zurücksetzen', () => setDialog({
                                        kind: 'confirm',
                                        title: 'Fortschritt zurücksetzen?',
                                        text: `Alle ${deckCards.length} Karten in „${deck.name}“ gelten danach wieder als neu.`,
                                        action: () => {
                                            actions.resetProgress(deck.id);
                                            toast('Fortschritt zurückgesetzt');
                                        },
                                    })), menuItem(Trash2, 'Stapel löschen', () => setDialog({
                                        kind: 'confirm',
                                        title: 'Stapel löschen?',
                                        text: `„${deck.name}“ und alle ${deckCards.length} Karten werden gelöscht. Tipp: Exportiere ihn vorher als CSV.`,
                                        danger: true,
                                        action: () => {
                                            actions.deleteDeck(deck.id);
                                            toast('Stapel gelöscht');
                                            navigate({ name: 'decks' });
                                        },
                                    }), true)] }))] }), _jsxs("div", { className: "deck-hero__main", children: [_jsx("span", { className: "deck-hero__icon", children: _jsx(DeckIcon, { name: deck.icon, size: 22 }) }), _jsxs("div", { children: [_jsx("h1", { children: deck.name }), deck.description && _jsx("p", { children: deck.description })] })] }), _jsxs("dl", { className: "deck-hero__stats", children: [_jsxs("div", { children: [_jsx("dt", { children: "Heute dran" }), _jsx("dd", { children: todayCount })] }), _jsxs("div", { children: [_jsx("dt", { children: "Neu" }), _jsx("dd", { children: stats.fresh })] }), _jsxs("div", { children: [_jsx("dt", { children: "Gemeistert" }), _jsx("dd", { children: stats.mastered })] })] }), _jsx(BoxBar, { boxes: stats.boxes, legend: true, size: "md" }), _jsx(StudyLauncher, { ...launch, scope: scope, hard: hard, methods: methods, methodKey: deck.id })] }), _jsxs("section", { children: [_jsxs("div", { className: "section-head", children: [_jsxs("h2", { children: ["Karten ", _jsx("span", { className: "muted", children: deckCards.length })] }), _jsxs("button", { className: "btn btn--primary btn--sm", onClick: () => setDialog({ kind: 'card' }), children: [_jsx(Plus, { size: 16 }), " Karte hinzuf\u00FCgen"] })] }), _jsxs("div", { className: "toolbar", children: [_jsxs("label", { className: "search", children: [_jsx(Search, { size: 18 }), _jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Karten durchsuchen", type: "search" })] }), tags.length > 0 && (_jsxs("div", { className: "chips", role: "group", "aria-label": "Nach Kategorie filtern", children: [_jsx("button", { className: `chip ${tag === null ? 'is-active' : ''}`, onClick: () => setTag(null), children: "Alle" }), tags.map((t) => (_jsx("button", { className: `chip ${tag === t ? 'is-active' : ''}`, onClick: () => setTag(tag === t ? null : t), children: t }, t)))] }))] }), visible.length === 0 ? (_jsxs("div", { className: "empty empty--inline", children: [_jsx("p", { children: deckCards.length === 0 ? 'Noch keine Karten. Leg die erste an oder importiere eine CSV-Datei.' : 'Keine Karten gefunden.' }), deckCards.length === 0 && (_jsxs("div", { className: "empty__actions", children: [_jsxs("button", { className: "btn btn--primary", onClick: () => setDialog({ kind: 'card' }), children: [_jsx(Plus, { size: 16 }), " Karte anlegen"] }), _jsxs("button", { className: "btn btn--ghost", onClick: () => setDialog({ kind: 'import' }), children: [_jsx(Upload, { size: 16 }), " CSV importieren"] })] }))] })) : (_jsx("ul", { className: "card-list", children: visible.map((c) => (_jsxs("li", { className: "card-row", onClick: () => setDialog({ kind: 'card', card: c }), children: [_jsxs("div", { className: "card-row__text", children: [_jsx("strong", { children: c.front }), _jsx("span", { children: c.back })] }), _jsxs("div", { className: "card-row__meta", children: [c.tag && !tag && _jsx("span", { className: "chip chip--sm hide-mobile", children: c.tag }), _jsx("span", { className: `card-row__due ${isDue(c, now) ? 'is-due' : ''}`, children: dueLabel(c, now) }), _jsx(BoxDots, { box: c.box }), supported && (_jsx(SpeakButton, { small: true, active: speakingKey === c.id, onSpeak: () => speak(c.front, resolveLang(deck.frontLang, settings), c.id) })), _jsx("button", { className: "icon-btn icon-btn--sm hide-mobile", "aria-label": "Karte l\u00F6schen", onClick: (e) => {
                                                e.stopPropagation();
                                                actions.deleteCard(c.id);
                                                toast('Karte gelöscht');
                                            }, children: _jsx(Trash2, { size: 16 }) })] })] }, c.id))) }))] }), dialog?.kind === 'card' && _jsx(CardEditor, { deckId: deck.id, card: dialog.card, tags: tags, onClose: () => setDialog(null) }), dialog?.kind === 'deck' && _jsx(DeckEditor, { deck: deck, onClose: () => setDialog(null) }), dialog?.kind === 'import' && _jsx(ImportDialog, { deckId: deck.id, onClose: () => setDialog(null) }), dialog?.kind === 'confirm' && (_jsx(Modal, { title: dialog.title, onClose: () => setDialog(null), footer: _jsxs(_Fragment, { children: [_jsx("button", { className: "btn btn--ghost", onClick: () => setDialog(null), children: "Abbrechen" }), _jsx("button", { className: `btn ${dialog.danger ? 'btn--danger' : 'btn--primary'}`, onClick: () => {
                                dialog.action();
                                setDialog(null);
                            }, children: "Best\u00E4tigen" })] }), children: _jsx("p", { children: dialog.text }) }))] }));
}
