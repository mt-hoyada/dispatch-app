// 서비스 워커 - 모바일 설치만 지원 (모든 네트워크 요청 우회)
console.log('[SW] 서비스 워커 활성화 - 모바일 설치만 지원, 모든 네트워크 요청 우회');

// 서비스 워커 버전
const CACHE_NAME = 'dispatch-app-v2.1.0';
const urlsToCache = [
  '/sw-app/manifest.json?v=2.1.0',
  '/sw-app/icon-192x192.png?v=2.1.0',
  '/sw-app/icon-512x512.png?v=2.1.0'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] 서비스 워커 설치됨 - 모바일 설치 지원');
  // 즉시 활성화 (대기하지 않음)
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 매니페스트 및 아이콘만 캐시');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('[SW] 캐시 생성 오류:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[SW] 서비스 워커 활성화됨 - 모든 네트워크 요청 우회');
  
  event.waitUntil(
    Promise.all([
      // 오래된 캐시 삭제
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 즉시 클라이언트 제어 시작
      self.clients.claim()
    ])
  );
});

// 페치 이벤트 - 매니페스트와 아이콘 외에는 모든 요청 우회
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // [추가] 웹소켓 요청(ws/wss)은 서비스워커가 절대 관여하지 않음!
  if (requestUrl.protocol === 'ws:' || requestUrl.protocol === 'wss:') {
    return;
  }

  // 매니페스트와 아이콘 파일만 캐시에서 처리
  if (requestUrl.pathname === '/sw-app/manifest.json' ||
      requestUrl.pathname === '/sw-app/icon-192x192.png' ||
      requestUrl.pathname === '/sw-app/icon-512x512.png') {
    console.log('[SW] 매니페스트/아이콘 요청 - 캐시 사용:', requestUrl.pathname);
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[SW] 캐시에서 반환:', requestUrl.pathname);
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('[SW] 캐시에 저장:', requestUrl.pathname);
                  cache.put(event.request, responseToCache);
                });
              return response;
            });
        })
    );
    return;
  }

  // 모든 다른 요청은 서비스워커가 아예 관여하지 않음
  console.log('[SW] 모든 요청 우회 - 브라우저 직접 처리:', requestUrl.pathname);
  return;
});

// 푸시 알림 처리 (모바일 설치 지원)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/sw-app/icon-192x192.png?v=2.1.0',
      badge: '/sw-app/icon-192x192.png?v=2.1.0',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 알림 클릭됨:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll().then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
}); 