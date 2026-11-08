import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { SpeakButton } from './SpeakButton';
const SWIPE_THRESHOLD = 90;
/** A quick flick counts too, even if it's short: px per ms and minimum distance. */
const FLICK_SPEED = 0.5;
const FLICK_DISTANCE = 35;
function sizeClass(text) {
    if (text.length <= 18)
        return 'card-text--xl';
    if (text.length <= 40)
        return 'card-text--lg';
    if (text.length <= 90)
        return 'card-text--md';
    return 'card-text--sm';
}
export function FlipCard(props) {
    const { question, answer, example, note, tag, flipped, onFlip, onSwipe, knownLabel = 'Gut', speak, speakingKey, speechSupported } = props;
    const scene = useRef(null);
    const drag = useRef(null);
    const frame = useRef(0);
    // Swiping rates the card, so it only follows the finger once the answer is visible.
    const canSwipe = flipped && !!onSwipe;
    useEffect(() => () => cancelAnimationFrame(frame.current), []);
    // The card follows the finger by writing styles directly, so React doesn't re-render on every move.
    const paint = (dx) => {
        const el = scene.current;
        if (!el)
            return;
        el.style.transform = dx ? `translate3d(${dx}px, 0, 0) rotate(${dx / 18}deg)` : '';
        el.style.setProperty('--pull', String(Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)));
        if (canSwipe && dx)
            el.dataset.swipe = dx > 0 ? 'known' : 'again';
        else
            delete el.dataset.swipe;
    };
    const release = () => {
        cancelAnimationFrame(frame.current);
        if (scene.current)
            delete scene.current.dataset.dragging;
    };
    const onPointerDown = (e) => {
        if (e.button > 0)
            return;
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, dx: 0, vx: 0, lastX: e.clientX, lastT: e.timeStamp };
    };
    const onPointerMove = (e) => {
        const d = drag.current;
        const el = scene.current;
        if (!d || d.id !== e.pointerId || !el)
            return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
                // Scrolling the back of the card, not a swipe and not a tap.
                drag.current = null;
                return;
            }
            if (Math.abs(dx) < 8)
                return;
            d.moved = true;
            el.setPointerCapture(e.pointerId);
            el.dataset.dragging = '';
        }
        const dt = Math.max(1, e.timeStamp - d.lastT);
        d.vx = 0.7 * ((e.clientX - d.lastX) / dt) + 0.3 * d.vx;
        d.lastX = e.clientX;
        d.lastT = e.timeStamp;
        // Before the answer is shown the card only gives a little, so it still feels alive.
        d.dx = canSwipe ? dx : dx * 0.2;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => paint(d.dx));
    };
    const onPointerUp = (e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId)
            return;
        drag.current = null;
        if (!d.moved) {
            onFlip();
            return;
        }
        release();
        const dir = Math.sign(d.dx);
        const flick = Math.abs(d.vx) > FLICK_SPEED && Math.abs(d.dx) > FLICK_DISTANCE && Math.sign(d.vx) === dir;
        const el = scene.current;
        if (canSwipe && el && (Math.abs(d.dx) > SWIPE_THRESHOLD || flick)) {
            // Fly out from where the finger let go instead of jumping back first.
            el.dataset.flying = '';
            el.style.transform = `translate3d(${dir * window.innerWidth * 1.1}px, 0, 0) rotate(${dir * 16}deg)`;
            el.style.opacity = '0';
            onSwipe(dir > 0);
        }
        else {
            paint(0);
        }
    };
    const onPointerCancel = () => {
        drag.current = null;
        release();
        paint(0);
    };
    return (_jsxs("div", { ref: scene, className: "flip-scene", onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerCancel, role: "button", tabIndex: 0, "aria-label": flipped ? 'Antwort, antippen zum Zurückdrehen' : 'Frage, antippen zum Umdrehen', onKeyDown: (e) => {
            if (e.key === 'Enter')
                onFlip();
        }, children: [_jsxs("div", { className: `flip-card ${flipped ? 'is-flipped' : ''}`, children: [_jsxs("div", { className: "flip-face flip-face--front", "aria-hidden": flipped, children: [_jsxs("div", { className: "flip-face__top", children: [tag ? _jsx("span", { className: "chip chip--sm", children: tag }) : _jsx("span", {}), speechSupported && (_jsx(SpeakButton, { active: speakingKey === 'q', onSpeak: () => speak(question.text, question.lang, 'q'), label: "Frage vorlesen" }))] }), _jsx("p", { className: `card-q ${sizeClass(question.text)}`, children: question.text }), _jsx("span", { className: "flip-face__hint", children: "Tippen zum Umdrehen" })] }), _jsxs("div", { className: "flip-face flip-face--back", "aria-hidden": !flipped, children: [_jsxs("div", { className: "card-ref", children: [_jsx("span", { children: question.text }), speechSupported && (_jsx(SpeakButton, { small: true, active: speakingKey === 'q', onSpeak: () => speak(question.text, question.lang, 'q'), label: "Frage vorlesen" }))] }), _jsxs("div", { className: "flip-face__content", children: [_jsx("p", { className: "card-meta", children: tag ? `Antwort · ${tag}` : 'Antwort' }), _jsxs("div", { className: "card-a-row", children: [_jsx("p", { className: `card-a ${sizeClass(answer.text)}`, children: answer.text }), speechSupported && (_jsx(SpeakButton, { small: true, active: speakingKey === 'a', onSpeak: () => speak(answer.text, answer.lang, 'a'), label: "Antwort vorlesen" }))] }), example && (_jsxs("div", { className: "card-example", children: [_jsxs("p", { children: ["\u201C", example.text, "\u201D"] }), speechSupported && (_jsx(SpeakButton, { small: true, active: speakingKey === 'e', onSpeak: () => speak(example.text, example.lang, 'e'), label: "Beispiel vorlesen" }))] }))] }), note && (_jsxs("div", { className: "card-note", children: [_jsx("span", { children: "Merkhilfe" }), _jsx("p", { children: note })] }))] })] }), _jsx("div", { className: "swipe-badge swipe-badge--known", "aria-hidden": "true", children: knownLabel }), _jsx("div", { className: "swipe-badge swipe-badge--again", "aria-hidden": "true", children: "Nochmal" })] }));
}
