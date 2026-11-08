import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DECK_ICONS, DeckIcon, ICON_KEYS, MARKER_NAMES } from '../lib/deckIcons';
import { actions } from '../lib/store';
import { navigate } from '../lib/router';
import { Modal } from './Modal';
import { toast } from './Toast';
export const COLOR_COUNT = MARKER_NAMES.length;
export const LANGS = [
    { value: 'de-DE', label: 'Deutsch' },
    { value: 'en-US', label: 'Englisch' },
    { value: 'fr-FR', label: 'Französisch' },
    { value: 'es-ES', label: 'Spanisch' },
    { value: 'it-IT', label: 'Italienisch' },
];
export function DeckEditor({ deck, onClose }) {
    const [name, setName] = useState(deck?.name ?? '');
    const [description, setDescription] = useState(deck?.description ?? '');
    const [icon, setIcon] = useState(deck?.icon ?? 'layers');
    const [color, setColor] = useState(deck?.color ?? Math.floor(Math.random() * COLOR_COUNT));
    const [frontLang, setFrontLang] = useState(deck?.frontLang.startsWith('en') ? 'en-US' : (deck?.frontLang ?? 'en-US'));
    const [backLang, setBackLang] = useState(deck?.backLang.startsWith('en') ? 'en-US' : (deck?.backLang ?? 'de-DE'));
    const save = () => {
        if (!name.trim())
            return;
        const data = { name: name.trim(), description: description.trim(), icon, color, frontLang, backLang };
        if (deck) {
            actions.updateDeck(deck.id, data);
            toast('Stapel gespeichert');
            onClose();
        }
        else {
            const id = actions.addDeck(data);
            toast('Stapel erstellt');
            onClose();
            navigate({ name: 'deck', id });
        }
    };
    return (_jsx(Modal, { title: deck ? 'Stapel bearbeiten' : 'Neuer Stapel', onClose: onClose, footer: _jsx("button", { className: "btn btn--primary", disabled: !name.trim(), onClick: save, children: deck ? 'Speichern' : 'Erstellen' }), children: _jsxs("form", { className: "form", onSubmit: (e) => {
                e.preventDefault();
                save();
            }, children: [_jsxs("div", { className: "deck-preview", "data-marker": color, children: [_jsx("i", { className: "tab", "aria-hidden": "true" }), _jsx(DeckIcon, { name: icon, size: 20 }), _jsx("strong", { children: name || 'Mein Stapel' })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Name" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "z. B. Spanisch Urlaub" })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Beschreibung ", _jsx("em", { children: "optional" })] }), _jsx("input", { value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("span", { children: "Symbol" }), _jsx("div", { className: "icon-grid", children: ICON_KEYS.filter((k) => k !== 'inbox' || icon === 'inbox').map((k) => (_jsx("button", { type: "button", className: k === icon ? 'is-active' : '', onClick: () => setIcon(k), "aria-label": DECK_ICONS[k].label, "aria-pressed": k === icon, title: DECK_ICONS[k].label, children: _jsx(DeckIcon, { name: k, size: 20 }) }, k))) })] }), _jsxs("div", { className: "field", children: [_jsx("span", { children: "Marker-Farbe" }), _jsx("div", { className: "color-grid", children: MARKER_NAMES.map((label, i) => (_jsx("button", { type: "button", "data-marker": i, className: i === color ? 'is-active' : '', onClick: () => setColor(i), "aria-label": label, "aria-pressed": i === color, title: label }, i))) })] }), _jsxs("div", { className: "field-row", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Sprache Vorderseite" }), _jsx("select", { value: frontLang, onChange: (e) => setFrontLang(e.target.value), children: LANGS.map((l) => (_jsx("option", { value: l.value, children: l.label }, l.value))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Sprache R\u00FCckseite" }), _jsx("select", { value: backLang, onChange: (e) => setBackLang(e.target.value), children: LANGS.map((l) => (_jsx("option", { value: l.value, children: l.label }, l.value))) })] })] }), _jsx("p", { className: "form__hint", children: "Die Sprache bestimmt, mit welcher Stimme die Karten vorgelesen werden." }), _jsx("button", { type: "submit", hidden: true })] }) }));
}
