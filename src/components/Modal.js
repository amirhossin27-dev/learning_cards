import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
/** Centered dialog on desktop, bottom sheet on phones. */
export function Modal({ title, onClose, children, footer, wide }) {
    const panel = useRef(null);
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        document.body.classList.add('no-scroll');
        panel.current?.querySelector('input, textarea, select')?.focus({ preventScroll: true });
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.classList.remove('no-scroll');
        };
    }, [onClose]);
    return (_jsx("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { ref: panel, className: `modal ${wide ? 'modal--wide' : ''}`, role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsx("div", { className: "modal__grip" }), _jsxs("header", { className: "modal__header", children: [_jsx("h2", { children: title }), _jsx("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schlie\u00DFen", children: _jsx(X, { size: 20 }) })] }), _jsx("div", { className: "modal__body", children: children }), footer && _jsx("footer", { className: "modal__footer", children: footer })] }) }));
}
