import { useEffect, useState } from 'react';

// Hash routing keeps deep links working on GitHub Pages without a server.
export type StudyMode = 'extra' | 'new';

// The URL uses German words, the code English ones.
const MODE_PARAM: Record<StudyMode, string> = { extra: 'extra', new: 'neu' };

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'deck'; id: string }
  /**
   * `id` undefined = today's round across all decks.
   * `extra` = study ahead without changing the schedule, `new` = learn new cards beyond today's budget.
   */
  | { name: 'study'; id?: string; tag?: string; mode?: StudyMode }
  | { name: 'stats' }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
  const mode = (Object.keys(MODE_PARAM) as StudyMode[]).find((m) => MODE_PARAM[m] === params.get('modus'));
  if (parts[0] === 'stapel') return { name: 'decks' };
  if (parts[0] === 'deck' && parts[1]) return { name: 'deck', id: parts[1] };
  if (parts[0] === 'lernen') return mode ? { name: 'study', mode } : { name: 'study' };
  if (parts[0] === 'study' && parts[1]) {
    const route: Route = { name: 'study', id: parts[1] };
    const tag = params.get('tag');
    if (tag) route.tag = tag;
    if (mode) route.mode = mode;
    return route;
  }
  if (parts[0] === 'statistik') return { name: 'stats' };
  if (parts[0] === 'settings') return { name: 'settings' };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'decks':
      return '#/stapel';
    case 'stats':
      return '#/statistik';
    case 'settings':
      return '#/settings';
    case 'deck':
      return `#/deck/${encodeURIComponent(route.id)}`;
    case 'study': {
      const params = new URLSearchParams();
      if (route.tag) params.set('tag', route.tag);
      if (route.mode) params.set('modus', MODE_PARAM[route.mode]);
      const query = params.toString() ? `?${params}` : '';
      return route.id ? `#/study/${encodeURIComponent(route.id)}${query}` : `#/lernen${query}`;
    }
  }
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
