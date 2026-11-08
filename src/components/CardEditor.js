import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { actions } from '../lib/store';
import { Modal } from './Modal';
import { toast } from './Toast';
export function CardEditor({ deckId, card, tags, onClose }) {
    const [form, setForm] = useState({
        front: card?.front ?? '',
        back: card?.back ?? '',
        example: card?.example ?? '',
        note: card?.note ?? '',
        tag: card?.tag ?? '',
    });
    const valid = form.front.trim() !== '' && form.back.trim() !== '';
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const save = (another) => {
        if (!valid)
            return;
        if (card) {
            actions.updateCard(card.id, form);
            toast('Karte gespeichert');
        }
        else {
            actions.addCard(deckId, form);
            toast('Karte hinzugefügt');
        }
        if (another)
            setForm((f) => ({ front: '', back: '', example: '', note: '', tag: f.tag }));
        else
            onClose();
    };
    return (_jsx(Modal, { title: card ? 'Karte bearbeiten' : 'Neue Karte', onClose: onClose, footer: _jsxs(_Fragment, { children: [card && (_jsxs("button", { className: "btn btn--ghost btn--danger-text", onClick: () => {
                        actions.deleteCard(card.id);
                        toast('Karte gelöscht');
                        onClose();
                    }, children: [_jsx(Trash2, { size: 16 }), " L\u00F6schen"] })), !card && (_jsx("button", { className: "btn btn--ghost", disabled: !valid, onClick: () => save(true), children: "Speichern & weitere" })), _jsx("button", { className: "btn btn--primary", disabled: !valid, onClick: () => save(false), children: "Speichern" })] }), children: _jsxs("form", { className: "form", onSubmit: (e) => {
                e.preventDefault();
                save(false);
            }, children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Vorderseite (Frage)" }), _jsx("textarea", { rows: 2, value: form.front, onChange: set('front'), placeholder: "z. B. to follow up" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "R\u00FCckseite (Antwort)" }), _jsx("textarea", { rows: 2, value: form.back, onChange: set('back'), placeholder: "z. B. nachfassen" })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Beispielsatz ", _jsx("em", { children: "optional" })] }), _jsx("textarea", { rows: 2, value: form.example, onChange: set('example'), placeholder: "I'll follow up on this next week." })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Eselsbr\u00FCcke / Notiz ", _jsx("em", { children: "optional" })] }), _jsx("textarea", { rows: 2, value: form.note, onChange: set('note') })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Kategorie ", _jsx("em", { children: "optional" })] }), _jsx("input", { value: form.tag, onChange: set('tag'), list: "tag-options", placeholder: "z. B. Meetings" }), _jsx("datalist", { id: "tag-options", children: tags.map((t) => (_jsx("option", { value: t }, t))) })] }), _jsx("button", { type: "submit", hidden: true })] }) }));
}
