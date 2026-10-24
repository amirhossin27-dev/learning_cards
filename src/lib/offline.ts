/**
 * Registers the service worker (public/sw.js) so the app keeps working
 * without a connection. Files that were already loaded before the worker took
 * over are handed to it once, so even the very first visit ends up cached.
 */
export function registerOffline() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      const ready = await navigator.serviceWorker.ready;
      const urls = performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((url) => url.startsWith(location.origin));
      ready.active?.postMessage({ type: 'cache', urls: [location.href.split('#')[0], ...urls] });
    } catch {
      // Offline support is a bonus; the app works the same without it.
    }
  });
}
