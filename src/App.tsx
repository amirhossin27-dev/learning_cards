import { GraduationCap, Layers, Settings as SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';
import { DeckPage } from './components/DeckPage';
import { HomePage } from './components/HomePage';
import { SettingsPage } from './components/SettingsPage';
import { StudyPage } from './components/StudyPage';
import { Toaster } from './components/Toast';
import { href, useRoute, type Route } from './lib/router';
import { useAppData } from './lib/store';

function useTheme(theme: 'dark' | 'light' | 'system') {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b0c16' : '#f4f5fb');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

function NavLinks({ route }: { route: Route }) {
  const decksActive = route.name === 'home' || route.name === 'deck' || route.name === 'study';
  return (
    <>
      <a className={`nav-link ${decksActive ? 'is-active' : ''}`} href={href({ name: 'home' })}>
        <Layers size={22} />
        <span>Stapel</span>
      </a>
      <a className={`nav-link ${route.name === 'settings' ? 'is-active' : ''}`} href={href({ name: 'settings' })}>
        <SettingsIcon size={22} />
        <span>Einstellungen</span>
      </a>
    </>
  );
}

export function App() {
  const route = useRoute();
  const { decks, settings } = useAppData();
  useTheme(settings.theme);

  const activeDeck = route.name === 'deck' || route.name === 'study' ? route.id : null;
  const studying = route.name === 'study';

  return (
    <div className={`app ${studying ? 'app--studying' : ''}`}>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <aside className="sidebar">
        <a className="brand" href={href({ name: 'home' })}>
          <span className="brand__logo">
            <GraduationCap size={22} />
          </span>
          <span className="brand__name">Karteikarten</span>
        </a>
        <nav className="sidebar__nav">
          <NavLinks route={route} />
        </nav>
        <div className="sidebar__decks">
          <p className="sidebar__label">Stapel</p>
          {decks.map((d) => (
            <a key={d.id} className={`sidebar__deck ${activeDeck === d.id ? 'is-active' : ''}`} href={href({ name: 'deck', id: d.id })}>
              <span className={`sidebar__dot grad-${d.color}`}>{d.emoji}</span>
              <span>{d.name}</span>
            </a>
          ))}
        </div>
      </aside>

      <main className="main">
        {route.name === 'home' && <HomePage />}
        {route.name === 'deck' && <DeckPage key={route.id} deckId={route.id} />}
        {route.name === 'study' && <StudyPage key={`${route.id}-${route.tag ?? ''}`} deckId={route.id} tag={route.tag} />}
        {route.name === 'settings' && <SettingsPage />}
      </main>

      <nav className="tabbar">
        <NavLinks route={route} />
      </nav>
      <Toaster />
    </div>
  );
}
