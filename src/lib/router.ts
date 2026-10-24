import { useEffect, useState } from 'react';

// Hash routing keeps deep links working on GitHub Pages without a server.
export type Route =
  | { name: 'home' }
  | { name: 'deck'; id: string }
  | { name: 'study'; id: string; tag?: string }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'deck' && parts[1]) return { name: 'deck', id: parts[1] };
  if (parts[0] === 'study' && parts[1]) {
    const tag = new URLSearchParams(query).get('tag');
    return tag ? { name: 'study', id: parts[1], tag } : { name: 'study', id: parts[1] };
  }
  if (parts[0] === 'settings') return { name: 'settings' };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'settings':
      return '#/settings';
    case 'deck':
      return `#/deck/${encodeURIComponent(route.id)}`;
    case 'study':
      return `#/study/${encodeURIComponent(route.id)}${route.tag ? `?tag=${encodeURIComponent(route.tag)}` : ''}`;
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
