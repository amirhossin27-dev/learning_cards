import { useEffect, useState } from 'react';
// The URL uses German words, the code English ones.
const MODE_PARAM = { extra: 'extra', new: 'neu', hard: 'schwierig' };
export function parseRoute(hash) {
    const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(query);
    const mode = Object.keys(MODE_PARAM).find((m) => MODE_PARAM[m] === params.get('modus'));
    if (parts[0] === 'stapel')
        return { name: 'decks' };
    if (parts[0] === 'deck' && parts[1])
        return { name: 'deck', id: parts[1] };
    if (parts[0] === 'lernen')
        return mode ? { name: 'study', mode } : { name: 'study' };
    if (parts[0] === 'study' && parts[1]) {
        const route = { name: 'study', id: parts[1] };
        const tag = params.get('tag');
        if (tag)
            route.tag = tag;
        if (mode)
            route.mode = mode;
        return route;
    }
    if (parts[0] === 'statistik')
        return { name: 'stats' };
    if (parts[0] === 'settings')
        return { name: 'settings' };
    return { name: 'home' };
}
export function href(route) {
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
            if (route.tag)
                params.set('tag', route.tag);
            if (route.mode)
                params.set('modus', MODE_PARAM[route.mode]);
            const query = params.toString() ? `?${params}` : '';
            return route.id ? `#/study/${encodeURIComponent(route.id)}${query}` : `#/lernen${query}`;
        }
    }
}
export function navigate(route) {
    window.location.hash = href(route);
}
export function useRoute() {
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
