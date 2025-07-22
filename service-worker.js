// 항상 네트워크에서만 최신 파일을 가져옴 (캐시 사용 안 함)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

// 설치 시 즉시 활성화
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 활성화 시 모든 캐시 삭제 + 클라이언트 강제 새로고침
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // 모든 캐시 삭제
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));

      // 모든 클라이언트를 제어하고 강제로 새로고침
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach(client => client.navigate(client.url));

      await self.clients.claim();
    })()
  );
}); 