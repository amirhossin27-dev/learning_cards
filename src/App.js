import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChartColumn, House, Layers, Settings as SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';
import { DeckPage } from './components/DeckPage';
import { DecksPage } from './components/DecksPage';
import { HomePage } from './components/HomePage';
import { LogoMark } from './components/Logo';
import { SettingsPage } from './components/SettingsPage';
import { StatsPage } from './components/StatsPage';
import { StudyPage } from './components/StudyPage';
import { Toaster } from './components/Toast';
import { useToday } from './hooks/useToday';
import { href, useRoute } from './lib/router';
import { useAppData } from './lib/store';
const THEME_COLOR = { light: '#F4F4F1', dark: '#121316' };
function useTheme(theme) {
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
            document.documentElement.dataset.theme = resolved;
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
        };
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);
}
function NavLinks({ route, due }) {
    const items = [
        { to: { name: 'home' }, label: 'Heute', icon: House, active: route.name === 'home', badge: due },
        { to: { name: 'decks' }, label: 'Stapel', icon: Layers, active: route.name === 'decks' || route.name === 'deck' },
        { to: { name: 'stats' }, label: 'Statistik', icon: ChartColumn, active: route.name === 'stats' },
        { to: { name: 'settings' }, label: 'Einstellungen', icon: SettingsIcon, active: route.name === 'settings' },
    ];
    return (_jsx(_Fragment, { children: items.map(({ to, label, icon: Icon, active, badge }) => (_jsxs("a", { className: `nav-link ${active ? 'is-active' : ''}`, href: href(to), "aria-current": active ? 'page' : undefined, children: [_jsx(Icon, { size: 21, strokeWidth: 1.9 }), _jsx("span", { children: label }), !!badge && _jsx("em", { "aria-label": `${badge} fällig`, children: badge > 99 ? '99+' : badge })] }, label))) }));
}
export function App() {
    const route = useRoute();
    const { decks, settings } = useAppData();
    const { count } = useToday();
    useTheme(settings.theme);
    const activeDeck = route.name === 'deck' ? route.id : null;
    const studying = route.name === 'study';
    return (_jsxs("div", { className: `app ${studying ? 'app--studying' : ''}`, children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("a", { className: "brand", href: href({ name: 'home' }), children: [_jsx(LogoMark, { size: 30 }), _jsx("span", { children: "Karteikarten" })] }), _jsx("nav", { className: "sidebar__nav", "aria-label": "Hauptnavigation", children: _jsx(NavLinks, { route: route, due: count }) }), _jsxs("div", { className: "sidebar__decks", children: [_jsx("p", { className: "label", children: "Stapel" }), decks.map((d) => (_jsxs("a", { className: `sidebar__deck ${activeDeck === d.id ? 'is-active' : ''}`, href: href({ name: 'deck', id: d.id }), "data-marker": d.color % 6, children: [_jsx("i", { className: "marker-tab", "aria-hidden": "true" }), _jsx("span", { children: d.name })] }, d.id)))] })] }), _jsxs("main", { className: "main", children: [route.name === 'home' && _jsx(HomePage, {}), route.name === 'decks' && _jsx(DecksPage, {}), route.name === 'deck' && _jsx(DeckPage, { deckId: route.id }, route.id), route.name === 'study' && (_jsx(StudyPage, { deckId: route.id, tag: route.tag, mode: route.mode }, `${route.id ?? 'all'}-${route.tag ?? ''}-${route.mode ?? ''}`)), route.name === 'stats' && _jsx(StatsPage, {}), route.name === 'settings' && _jsx(SettingsPage, {})] }), _jsx("nav", { className: "tabbar", "aria-label": "Hauptnavigation", children: _jsx(NavLinks, { route: route, due: count }) }), _jsx(Toaster, {})] }));
}
