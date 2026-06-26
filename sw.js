/* App de Gastos — service worker */
const CACHE = 'gastos-app-v6';
const CORE = [
  './',
  './index.html',
  './App de Gastos.dc.html',
  './support.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isHTML(req) {
  return req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html')
    || /\.html(\?|$)/.test(req.url);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML / telas: rede primeiro (sempre pega a versão mais nova), cache como reserva offline.
  if (isHTML(req)) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./App de Gastos.dc.html')))
    );
    return;
  }

  // Demais recursos (ícones, fontes, scripts): cache primeiro, com atualização em segundo plano.
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => undefined);
    })
  );
});
