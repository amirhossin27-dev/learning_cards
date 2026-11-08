import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { FileUp, Info } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { importCsv } from '../lib/csv';
import { navigate } from '../lib/router';
import { actions, useAppData } from '../lib/store';
import { COLOR_COUNT, LANGS } from './DeckEditor';
import { Modal } from './Modal';
import { toast } from './Toast';
const NEW = '__new__';
const normalize = (s) => s.trim().toLowerCase();
export function ImportDialog({ deckId, onClose }) {
    const { decks, cards } = useAppData();
    const input = useRef(null);
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState(false);
    const [target, setTarget] = useState(deckId ?? NEW);
    const [newName, setNewName] = useState('');
    const [frontLang, setFrontLang] = useState('en-US');
    const [backLang, setBackLang] = useState('de-DE');
    const readFile = async (file) => {
        setError('');
        try {
            const parsed = importCsv(await file.text());
            if (parsed.cards.length === 0) {
                setError('In der Datei wurden keine Karten gefunden. Erwartet werden mindestens zwei Spalten: Frage und Antwort.');
                setResult(null);
                return;
            }
            setFileName(file.name);
            setNewName(file.name.replace(/\.(csv|txt)$/i, '').replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase()));
            setResult(parsed);
        }
        catch {
            setError('Die Datei konnte nicht gelesen werden.');
        }
    };
    const existingFronts = useMemo(() => new Set(cards.filter((c) => c.deckId === target).map((c) => normalize(c.front))), [cards, target]);
    const fresh = useMemo(() => result?.cards.filter((c) => !existingFronts.has(normalize(c.front))) ?? [], [result, existingFronts]);
    const alreadyThere = (result?.cards.length ?? 0) - fresh.length;
    const confirm = () => {
        if (!result || fresh.length === 0)
            return;
        let id = target;
        if (target === NEW) {
            id = actions.addDeck({
                name: newName.trim() || 'Importierte Karten',
                description: `Importiert aus ${fileName}`,
                icon: 'inbox',
                color: Math.floor(Math.random() * COLOR_COUNT),
                frontLang,
                backLang,
            });
        }
        actions.importCards(id, fresh);
        toast(`${fresh.length} Karten importiert`);
        onClose();
        navigate({ name: 'deck', id });
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file)
            readFile(file);
    };
    return (_jsxs(Modal, { title: "CSV importieren", onClose: onClose, wide: true, footer: result && (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn btn--ghost", onClick: () => setResult(null), children: "Andere Datei" }), _jsxs("button", { className: "btn btn--primary", onClick: confirm, disabled: fresh.length === 0, children: [fresh.length, " ", fresh.length === 1 ? 'Karte' : 'Karten', " importieren"] })] })), children: [_jsx("input", { ref: input, type: "file", accept: ".csv,.txt,text/csv,text/plain", hidden: true, onChange: (e) => {
                    const file = e.target.files?.[0];
                    if (file)
                        readFile(file);
                    e.target.value = '';
                } }), !result ? (_jsxs(_Fragment, { children: [_jsxs("button", { className: `dropzone ${dragging ? 'is-dragging' : ''}`, onClick: () => input.current?.click(), onDragOver: (e) => {
                            e.preventDefault();
                            setDragging(true);
                        }, onDragLeave: () => setDragging(false), onDrop: onDrop, children: [_jsx(FileUp, { size: 36 }), _jsx("strong", { children: "CSV-Datei ausw\u00E4hlen" }), _jsx("span", { children: "oder hierher ziehen" })] }), error && _jsx("p", { className: "form__error", children: error }), _jsxs("div", { className: "info-box", children: [_jsx(Info, { size: 18 }), _jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Format:" }), " Spalte 1 = Vorderseite, Spalte 2 = R\u00FCckseite. Optional: Beispielsatz, Notiz, Kategorie."] }), _jsx("p", { children: "Kopfzeile, Komma oder Semikolon (Excel) werden automatisch erkannt. Doppelte Eintr\u00E4ge in beide Richtungen werden zu einer Karte zusammengefasst." })] })] })] })) : (_jsxs("div", { className: "form", children: [_jsxs("div", { className: "import-summary", children: [_jsxs("div", { children: [_jsx("strong", { children: result.cards.length }), _jsx("span", { children: "Karten erkannt" })] }), result.reversedSkipped > 0 && (_jsxs("div", { children: [_jsx("strong", { children: result.reversedSkipped }), _jsx("span", { children: "Umkehr-Duplikate zusammengefasst" })] })), alreadyThere > 0 && (_jsxs("div", { children: [_jsx("strong", { children: alreadyThere }), _jsx("span", { children: "schon im Stapel" })] }))] }), _jsxs("div", { className: "preview-table", role: "table", "aria-label": "Vorschau", children: [_jsxs("div", { className: "preview-table__row preview-table__row--head", role: "row", children: [_jsx("span", { role: "columnheader", children: "Vorderseite" }), _jsx("span", { role: "columnheader", children: "R\u00FCckseite" })] }), result.cards.slice(0, 6).map((c, i) => (_jsxs("div", { className: "preview-table__row", role: "row", children: [_jsx("span", { role: "cell", children: c.front }), _jsx("span", { role: "cell", children: c.back })] }, i))), result.cards.length > 6 && _jsxs("div", { className: "preview-table__more", children: ["\u2026 und ", result.cards.length - 6, " weitere"] })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Importieren in" }), _jsxs("select", { value: target, onChange: (e) => setTarget(e.target.value), children: [_jsx("option", { value: NEW, children: "Neuer Stapel" }), decks.map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] })] }), target === NEW && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Name des neuen Stapels" }), _jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value) })] }), _jsxs("div", { className: "field-row", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Sprache Vorderseite" }), _jsx("select", { value: frontLang, onChange: (e) => setFrontLang(e.target.value), children: LANGS.map((l) => (_jsx("option", { value: l.value, children: l.label }, l.value))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Sprache R\u00FCckseite" }), _jsx("select", { value: backLang, onChange: (e) => setBackLang(e.target.value), children: LANGS.map((l) => (_jsx("option", { value: l.value, children: l.label }, l.value))) })] })] })] }))] }))] }));
}
