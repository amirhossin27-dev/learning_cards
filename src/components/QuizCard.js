import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Check, Volume2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { SpeakButton } from './SpeakButton';
function sizeClass(text) {
    if (text.length <= 18)
        return 'card-text--xl';
    if (text.length <= 40)
        return 'card-text--lg';
    if (text.length <= 90)
        return 'card-text--md';
    return 'card-text--sm';
}
const RESULT_TEXT = {
    choice: ['Richtig', 'Leider falsch'],
    cloze: ['Richtig', 'Leider falsch'],
    listen: ['Richtig verstanden', 'Leider falsch'],
    truefalse: ['Richtig erkannt', 'Leider daneben'],
};
/** A question with a few answers to tap: multiple choice, gap in a sentence, listening, or true or false. */
export function QuizCard(props) {
    const { q, question, answer, example, note, tag, meaning, result, leaving, onPick, onContinue, speak, speakingKey, speechSupported } = props;
    const next = useRef(null);
    useEffect(() => {
        if (result)
            next.current?.focus({ preventScroll: true });
    }, [result]);
    const speakQuestion = () => speak(question.text, question.lang, 'q');
    // The sentence itself is the question in a gap, so it isn't repeated below.
    const showExample = q.kind !== 'cloze' && example;
    const showAnswer = q.kind === 'truefalse' && !q.isTrue;
    return (_jsxs("div", { className: `quiz quiz--${q.kind} ${leaving ? 'is-leaving' : ''}`, children: [_jsxs("div", { className: `quiz-card ${result ? (result.correct ? 'is-right' : 'is-wrong') : ''}`, children: [_jsxs("div", { className: "flip-face__top", children: [_jsxs("span", { className: "quiz-card__chips", children: [tag && _jsx("span", { className: "chip chip--sm", children: tag }), q.fallback && _jsx("span", { className: "chip chip--sm", children: q.fallback })] }), speechSupported && q.kind !== 'listen' && q.kind !== 'cloze' && (_jsx(SpeakButton, { active: speakingKey === 'q', onSpeak: speakQuestion, label: "Frage vorlesen" }))] }), q.kind === 'cloze' ? (_jsxs("div", { className: "quiz-card__body", children: [_jsx("p", { className: "card-meta", children: "Was fehlt im Satz?" }), _jsxs("p", { className: "cloze", children: [q.cloze.before, _jsx("span", { className: `cloze__gap ${result ? 'is-filled' : ''}`, children: result ? q.cloze.gap : '      ' }), q.cloze.after] }), meaning && (_jsxs("p", { className: "cloze__hint", children: [_jsx("span", { children: "Bedeutung" }), " ", meaning] })), result && example && speechSupported && (_jsxs("div", { className: "card-a-row", children: [_jsx("p", { className: "card-meta", children: "Satz anh\u00F6ren" }), _jsx(SpeakButton, { small: true, active: speakingKey === 'e', onSpeak: () => speak(example.text, example.lang, 'e'), label: "Satz vorlesen" })] }))] })) : q.kind === 'listen' && !result ? (_jsxs("div", { className: "quiz-card__body quiz-card__body--listen", children: [_jsx("button", { type: "button", className: `listen-btn ${speakingKey === 'q' ? 'is-active' : ''}`, onClick: speakQuestion, "aria-label": "Nochmal anh\u00F6ren", children: _jsx(Volume2, { size: 34 }) }), _jsx("p", { className: "card-meta", children: "Was bedeutet das, was du h\u00F6rst?" })] })) : (_jsx("p", { className: `card-q quiz-card__q ${sizeClass(question.text)}`, children: question.text })), q.kind === 'truefalse' && (_jsxs("div", { className: "quiz-card__claim", children: [_jsx("p", { className: "card-meta", children: "Stimmt diese Antwort?" }), _jsx("p", { className: `card-a ${sizeClass(q.shown)} ${result ? (q.isTrue ? 'is-true' : 'is-false') : ''}`, children: q.shown })] })), result && (showAnswer || showExample || note) && (_jsxs("div", { className: "quiz-card__reveal", children: [showAnswer && (_jsxs(_Fragment, { children: [_jsx("p", { className: "card-meta", children: "Richtig w\u00E4re" }), _jsx("p", { className: `card-a ${sizeClass(answer.text)}`, children: answer.text })] })), showExample && (_jsxs("div", { className: "card-example", children: [_jsxs("p", { children: ["\u201C", example.text, "\u201D"] }), speechSupported && (_jsx(SpeakButton, { small: true, active: speakingKey === 'e', onSpeak: () => speak(example.text, example.lang, 'e'), label: "Beispiel vorlesen" }))] })), note && (_jsxs("div", { className: "card-note", children: [_jsx("span", { children: "Merkhilfe" }), _jsx("p", { children: note })] }))] }))] }), _jsx("div", { className: `quiz-options ${q.kind === 'truefalse' ? 'quiz-options--tf' : ''}`, role: "group", "aria-label": "Antworten", children: q.options.map((text, i) => {
                    const state = !result ? '' : i === q.correct ? 'is-right' : i === result.picked ? 'is-wrong' : 'is-dim';
                    const tone = q.kind === 'truefalse' ? (i === 0 ? 'tf-no' : 'tf-yes') : '';
                    return (_jsxs("button", { type: "button", className: `quiz-option ${tone} ${state}`, onClick: () => onPick(i), disabled: !!result, children: [_jsx("kbd", { className: "only-pointer", children: q.kind === 'truefalse' ? (i === 0 ? '←' : '→') : i + 1 }), _jsx("span", { children: text }), state === 'is-right' && _jsx(Check, { size: 18, className: "quiz-option__icon" }), state === 'is-wrong' && _jsx(X, { size: 18, className: "quiz-option__icon" })] }, i));
                }) }), result && (_jsxs("div", { className: "quiz-result", children: [_jsxs("p", { className: `quiz-result__text ${result.correct ? 'is-right' : 'is-wrong'}`, role: "status", children: [result.correct ? _jsx(Check, { size: 18 }) : _jsx(X, { size: 18 }), RESULT_TEXT[q.kind][result.correct ? 0 : 1]] }), _jsx("button", { ref: next, type: "button", className: "btn btn--primary btn--xl", onClick: onContinue, children: "Weiter" })] }))] }));
}
