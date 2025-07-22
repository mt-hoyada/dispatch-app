// 항상 네트워크에서 최신 파일을 불러오고, 오프라인일 때만 캐시 사용
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request)) // 네트워크가 안될 때만 캐시 사용
  );
});

// install 이벤트에서 즉시 활성화
self.addEventListener('install', event => {
  self.skipWaiting();
});

// activate 시 기존 캐시 모두 삭제 후 클라이언트 제어
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }).then(() => self.clients.claim())
  );
}); 