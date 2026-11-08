import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { shuffled } from '../lib/questions';
/** Match questions with answers: tap one on the left and one on the right. */
export function PairsBoard({ pairs, leaving, onDone }) {
    // Both columns are shuffled once, so they don't jump around while playing.
    const left = useMemo(() => shuffled(pairs, Math.random), [pairs]);
    const right = useMemo(() => shuffled(pairs, Math.random), [pairs]);
    const [selected, setSelected] = useState(null);
    const [matched, setMatched] = useState(() => new Set());
    const [wrong, setWrong] = useState(null);
    const mistakes = useRef({});
    const next = useRef(null);
    const done = matched.size === pairs.length;
    useEffect(() => {
        if (!wrong)
            return;
        const timer = window.setTimeout(() => setWrong(null), 650);
        return () => window.clearTimeout(timer);
    }, [wrong]);
    useEffect(() => {
        if (done)
            next.current?.focus({ preventScroll: true });
    }, [done]);
    const tap = (side, id) => {
        if (matched.has(id) || done)
            return;
        if (!selected || selected.side === side) {
            setSelected(selected?.side === side && selected.id === id ? null : { side, id });
            return;
        }
        const q = side === 'q' ? id : selected.id;
        const a = side === 'a' ? id : selected.id;
        setSelected(null);
        if (q === a) {
            setMatched((m) => new Set(m).add(q));
        }
        else {
            // A wrong match counts against both cards involved.
            mistakes.current[q] = (mistakes.current[q] ?? 0) + 1;
            mistakes.current[a] = (mistakes.current[a] ?? 0) + 1;
            setWrong({ q, a });
        }
    };
    const tile = (side, p) => {
        const isMatched = matched.has(p.id);
        const isSelected = selected?.side === side && selected.id === p.id;
        const isWrong = wrong?.[side] === p.id;
        return (_jsx("button", { type: "button", className: `pair-tile pair-tile--${side} ${isMatched ? 'is-matched' : ''} ${isSelected ? 'is-selected' : ''} ${isWrong ? 'is-wrong' : ''}`, onClick: () => tap(side, p.id), disabled: isMatched, "aria-pressed": isSelected, children: _jsx("span", { children: side === 'q' ? p.question : p.answer }) }, p.id));
    };
    const firstTry = pairs.filter((p) => !mistakes.current[p.id]).length;
    return (_jsxs("div", { className: `quiz pairs ${leaving ? 'is-leaving' : ''}`, children: [_jsx("p", { className: "pairs__title", children: done ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 18 }), " Alle Paare gefunden \u00B7 ", firstTry, " von ", pairs.length, " auf Anhieb"] })) : ('Tippe ein Paar an: links die Frage, rechts die Antwort') }), _jsxs("div", { className: "pairs__grid", children: [_jsx("div", { className: "pairs__col", children: left.map((p) => tile('q', p)) }), _jsx("div", { className: "pairs__col", children: right.map((p) => tile('a', p)) })] }), done && (_jsx("div", { className: "quiz-result", children: _jsx("button", { ref: next, type: "button", className: "btn btn--primary btn--xl", onClick: () => onDone({ ...mistakes.current }), children: "Weiter" }) }))] }));
}
