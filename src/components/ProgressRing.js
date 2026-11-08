import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProgressRing({ value, size = 56, stroke = 6, label }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
    return (_jsxs("div", { className: "ring", style: { width: size, height: size }, role: "img", "aria-label": `${pct} % gelernt`, children: [_jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, children: [_jsx("circle", { className: "ring__track", cx: size / 2, cy: size / 2, r: r, strokeWidth: stroke, fill: "none" }), _jsx("circle", { className: "ring__value", cx: size / 2, cy: size / 2, r: r, strokeWidth: stroke, fill: "none", strokeDasharray: c, strokeDashoffset: c * (1 - pct / 100), strokeLinecap: "round", transform: `rotate(-90 ${size / 2} ${size / 2})` })] }), _jsx("span", { className: "ring__label", children: label ?? `${pct}%` })] }));
}
