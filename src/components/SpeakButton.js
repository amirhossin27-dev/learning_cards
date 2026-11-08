import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Volume2 } from 'lucide-react';
export function SpeakButton({ onSpeak, active, label = 'Vorlesen', small }) {
    return (_jsxs("button", { type: "button", className: `speak-btn ${active ? 'is-active' : ''} ${small ? 'speak-btn--small' : ''}`, onClick: (e) => {
            e.stopPropagation();
            onSpeak();
        }, onPointerDown: (e) => e.stopPropagation(), "aria-label": label, title: label, children: [_jsx(Volume2, { size: small ? 16 : 20 }), _jsxs("span", { className: "speak-btn__waves", "aria-hidden": "true", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {})] })] }));
}
