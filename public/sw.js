// Offline support: pages are network-first (so updates arrive right away),
// hashed build files and recordings are cache-first because their names change
// whenever their content does.
const CACHE = 'karteikarten-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache') return;
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(event.data.urls.map((url) => cache.add(url).catch(() => {})))));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const { pathname } = new URL(request.url);
  if (pathname.includes('/audio/')) event.respondWith(recording(request));
  else event.respondWith(pathname.includes('/assets/') ? cacheFirst(request) : networkFirst(request));
});

// Recordings are cached whole. Safari's player asks for byte ranges, so those are cut from the cached file.
async function recording(request) {
  const cache = await caches.open(CACHE);
  let full = await cache.match(request.url);
  if (!full) {
    full = await fetch(request.url);
    if (!full.ok) return full;
    await cache.put(request.url, full.clone());
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!range || (!range[1] && !range[2])) return full;
  const body = await full.blob();
  const start = range[1] ? Number(range[1]) : Math.max(0, body.size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), body.size - 1) : body.size - 1;
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${body.size}` } });
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${body.size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await caches.match(request, { ignoreSearch: true })) || (request.mode === 'navigate' && (await caches.match('./')));
    if (cached) return cached;
    throw error;
  }
}
