import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BOX_LABELS } from '../lib/srs';
/** Leitner boxes as one stacked bar: light = Fach 1, dark = mastered. */
export function BoxBar({ boxes, legend, size = 'sm' }) {
    const total = boxes.reduce((a, b) => a + b, 0);
    const summary = boxes.map((n, i) => `${BOX_LABELS[i]}: ${n}`).join(', ');
    return (_jsxs("div", { className: `boxbar boxbar--${size}`, children: [_jsx("div", { className: "boxbar__track", role: "img", "aria-label": `Lernstand. ${summary}`, children: total === 0 ? (_jsx("i", { className: "boxbar__empty" })) : (boxes.map((n, i) => n > 0 && _jsx("i", { className: `boxbar__seg b${i}`, style: { flexGrow: n }, title: `${BOX_LABELS[i]}: ${n}` }, i))) }), legend && (_jsx("ul", { className: "boxbar__legend", children: boxes.map((n, i) => (_jsxs("li", { children: [_jsx("i", { className: `b${i}` }), _jsx("span", { children: BOX_LABELS[i] }), _jsx("strong", { children: n })] }, i))) }))] }));
}
