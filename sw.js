const CACHE_NAME = 'atividoso-v2';

// Instala o service worker e pula a espera
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Limpa caches antigos quando atualiza
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key !== CACHE_NAME) {
        return caches.delete(key);
      }
    }));
  }));
});

// Estratégia: "Tenta a internet primeiro. Se falhar, usa o cache."
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
