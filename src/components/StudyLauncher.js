import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check, ChevronDown, ChevronRight, Dumbbell, Headphones, Layers, ListChecks, Play, Shapes, Target, TextCursorInput, ThumbsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { href } from '../lib/router';
import { METHODS } from '../lib/quiz';
import { actions, getState, useAppData } from '../lib/store';
export const METHOD_ICONS = {
    flip: Layers,
    choice: ListChecks,
    cloze: TextCursorInput,
    listen: Headphones,
    pairs: Shapes,
    truefalse: ThumbsUp,
};
/**
 * One big button that starts whatever is due (or new cards, or free practice
 * when everything is done), with quieter chips for the other ways to learn.
 */
export function StudyLauncher({ route, title, subtitle, isPractice, scope, hard, methods, methodKey, children }) {
    return (_jsxs("div", { className: "launcher", children: [route ? (_jsxs("a", { className: "launcher__go", href: href(route), children: [_jsx(Play, { size: 22, fill: "currentColor" }), _jsxs("span", { children: [_jsx("strong", { children: title }), _jsx("small", { children: subtitle })] }), _jsx(ChevronRight, { size: 20, className: "launcher__chev" })] })) : (_jsxs("span", { className: "launcher__go is-disabled", "aria-disabled": "true", children: [_jsx(Play, { size: 22 }), _jsxs("span", { children: [_jsx("strong", { children: title }), _jsx("small", { children: subtitle })] })] })), (route || children) && (_jsxs("div", { className: "launcher__chips", children: [route && !isPractice && (_jsxs("a", { className: "launcher__chip", href: href({ ...scope, mode: 'extra' }), children: [_jsx(Dumbbell, { size: 15 }), " Freies \u00DCben"] })), route && hard > 0 && (_jsxs("a", { className: "launcher__chip", href: href({ ...scope, mode: 'hard' }), children: [_jsx(Target, { size: 15 }), " Schwierige ", _jsx("b", { children: hard })] })), route && _jsx(MethodChip, { methods: methods, methodKey: methodKey }), children] }))] }));
}
/** Shows and changes the study method stored for this deck (or for the start page). */
function MethodChip({ methods, methodKey }) {
    const [open, setOpen] = useState(false);
    const box = useRef(null);
    const panel = useRef(null);
    const saved = useAppData().settings.methods?.[methodKey];
    const current = saved && methods.includes(saved) ? saved : 'flip';
    const Icon = METHOD_ICONS[current];
    useEffect(() => {
        if (!open)
            return;
        panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const close = (e) => !box.current?.contains(e.target) && setOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);
    const choose = (value) => {
        actions.updateSettings({
            methods: { ...getState().settings.methods, [methodKey]: value },
        });
        setOpen(false);
    };
    return (_jsxs("div", { className: "menu", ref: box, children: [_jsxs("button", { type: "button", className: "launcher__chip", onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu", children: [_jsx(Icon, { size: 15 }), " Methode: ", METHODS.find((m) => m.value === current)?.label, _jsx(ChevronDown, { size: 14 })] }), open && (_jsxs("div", { ref: panel, className: "menu__panel menu__panel--left", role: "menu", children: [_jsx("p", { className: "menu__label", children: "So fragt dich die App ab" }), METHODS.filter((m) => methods.includes(m.value)).map(({ value, label }) => {
                        const ItemIcon = METHOD_ICONS[value];
                        return (_jsxs("button", { role: "menuitemradio", "aria-checked": current === value, className: `menu__item ${current === value ? 'is-active' : ''}`, onClick: () => choose(value), children: [_jsx(ItemIcon, { size: 16 }), " ", label, current === value && _jsx(Check, { size: 16, className: "menu__check" })] }, value));
                    })] }))] }));
}
