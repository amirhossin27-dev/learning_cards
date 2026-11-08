import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Flame } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
export function GoalCard({ reviews, goal, streak, className = '' }) {
    const reached = reviews >= goal;
    return (_jsxs("div", { className: `goal ${reached ? 'is-reached' : ''} ${className}`, children: [_jsx(ProgressRing, { value: reviews / Math.max(1, goal), size: 52, stroke: 6, label: String(Math.min(reviews, 999)) }), _jsxs("div", { children: [_jsx("strong", { children: reached ? 'Tagesziel erreicht' : `Tagesziel: ${reviews} von ${goal} Karten` }), _jsxs("span", { children: [_jsx(Flame, { size: 14 }), streak === 0 ? 'Starte heute deine Lernserie' : streak === 1 ? '1 Tag in Folge gelernt' : `${streak} Tage in Folge gelernt`] })] })] }));
}
