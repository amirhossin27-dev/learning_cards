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
import { href, useRoute, type Route } from './lib/router';
import { useAppData } from './lib/store';

const THEME_COLOR = { light: '#F4F4F1', dark: '#121316' };

function useTheme(theme: 'dark' | 'light' | 'system') {
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

function NavLinks({ route, due }: { route: Route; due: number }) {
  const items = [
    { to: { name: 'home' } as Route, label: 'Heute', icon: House, active: route.name === 'home', badge: due },
    { to: { name: 'decks' } as Route, label: 'Stapel', icon: Layers, active: route.name === 'decks' || route.name === 'deck' },
    { to: { name: 'stats' } as Route, label: 'Statistik', icon: ChartColumn, active: route.name === 'stats' },
    { to: { name: 'settings' } as Route, label: 'Einstellungen', icon: SettingsIcon, active: route.name === 'settings' },
  ];
  return (
    <>
      {items.map(({ to, label, icon: Icon, active, badge }) => (
        <a key={label} className={`nav-link ${active ? 'is-active' : ''}`} href={href(to)} aria-current={active ? 'page' : undefined}>
          <Icon size={21} strokeWidth={1.9} />
          <span>{label}</span>
          {!!badge && <em aria-label={`${badge} fällig`}>{badge > 99 ? '99+' : badge}</em>}
        </a>
      ))}
    </>
  );
}

export function App() {
  const route = useRoute();
  const { decks, settings } = useAppData();
  const { count } = useToday();
  useTheme(settings.theme);

  const activeDeck = route.name === 'deck' ? route.id : null;
  const studying = route.name === 'study';

  return (
    <div className={`app ${studying ? 'app--studying' : ''}`}>
      <aside className="sidebar">
        <a className="brand" href={href({ name: 'home' })}>
          <LogoMark size={30} />
          <span>Karteikarten</span>
        </a>
        <nav className="sidebar__nav" aria-label="Hauptnavigation">
          <NavLinks route={route} due={count} />
        </nav>
        <div className="sidebar__decks">
          <p className="label">Stapel</p>
          {decks.map((d) => (
            <a
              key={d.id}
              className={`sidebar__deck ${activeDeck === d.id ? 'is-active' : ''}`}
              href={href({ name: 'deck', id: d.id })}
              data-marker={d.color % 6}
            >
              <i className="marker-tab" aria-hidden="true" />
              <span>{d.name}</span>
            </a>
          ))}
        </div>
      </aside>

      <main className="main">
        {route.name === 'home' && <HomePage />}
        {route.name === 'decks' && <DecksPage />}
        {route.name === 'deck' && <DeckPage key={route.id} deckId={route.id} />}
        {route.name === 'study' && (
          <StudyPage key={`${route.id ?? 'all'}-${route.tag ?? ''}-${route.mode ?? ''}`} deckId={route.id} tag={route.tag} mode={route.mode} />
        )}
        {route.name === 'stats' && <StatsPage />}
        {route.name === 'settings' && <SettingsPage />}
      </main>

      <nav className="tabbar" aria-label="Hauptnavigation">
        <NavLinks route={route} due={count} />
      </nav>
      <Toaster />
    </div>
  );
}
