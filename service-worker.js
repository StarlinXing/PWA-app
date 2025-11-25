const CACHE_NAME = 'gemini-pwa-cache-v1';
const urlsToCache = [
    '/', // 根目錄
    '/index.html',
    '/manifest.json',
    // 記得將您的圖標文件加入快取
    '/images/icon-192x192.png',
    '/images/icon-512x512.png'
];

// === 1. 安裝階段 (Install) ===
self.addEventListener('install', event => {
    // 等待所有資產被快取完成
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: 打開快取，開始預快取資產');
                return cache.addAll(urlsToCache);
            })
    );
});

// === 2. 啟動階段 (Activate) ===
self.addEventListener('activate', event => {
    // 清理舊的快取
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// === 3. 抓取階段 (Fetch) ===
// 這是 Service Worker 攔截網路請求的關鍵步驟
self.addEventListener('fetch', event => {
    // 對於所有請求，都嘗試先從快取中尋找
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果快取中有資源，則返回快取的版本 (Cache First)
                if (response) {
                    console.log('Service Worker: 從快取中找到資源:', event.request.url);
                    return response;
                }
                
                // 如果快取中沒有，則嘗試從網路抓取
                console.log('Service Worker: 網路抓取資源:', event.request.url);
                return fetch(event.request);
            })
    );
});
