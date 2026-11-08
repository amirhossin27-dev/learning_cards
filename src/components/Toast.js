import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CircleCheck, Info } from 'lucide-react';
import { useSyncExternalStore } from 'react';
let toasts = [];
let nextId = 1;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
export function toast(text, kind = 'done') {
    const id = nextId++;
    toasts = [...toasts, { id, text, kind }];
    emit();
    // Hints need a little longer to read than confirmations.
    setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        emit();
    }, kind === 'info' ? 5000 : 3200);
}
export function Toaster() {
    const items = useSyncExternalStore((l) => {
        listeners.add(l);
        return () => listeners.delete(l);
    }, () => toasts);
    return (_jsx("div", { className: "toaster", "aria-live": "polite", children: items.map((t) => (_jsxs("div", { className: "toast", children: [t.kind === 'info' ? _jsx(Info, { size: 18 }) : _jsx(CircleCheck, { size: 18 }), _jsx("span", { children: t.text })] }, t.id))) }));
}
