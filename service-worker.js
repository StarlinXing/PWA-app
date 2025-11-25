const CACHE_NAME = 'pwa-example-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc/pc/super_tool/6ff112048c4b4df4bf823a3f2be33c76~tplv-a9rns2rl98-image.image?rcl=20251125160022B4FD00775976597CAC78&rk3s=8e244e95&rrcfp=f06b921b&x-expires=1766649636&x-signature=PELt4DSgXQjoZmI8YVCqfBfqp4A%3D',
  'https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc/pc/super_tool/ef65e9a695524af4aefceba28d2c9935~tplv-a9rns2rl98-image.image?rcl=20251125160022B4FD00775976597CAC78&rk3s=8e244e95&rrcfp=f06b921b&x-expires=1766649643&x-signature=fnObapNSN1ds7ZzL9BXyIO7Gnlw%3D'
];

// Install event - cache all necessary assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  // Wait until the cache is created and assets are cached
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached assets when offline
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetching');
  
  event.respondWith(
    // Try to get the resource from the cache first
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available, otherwise fetch from network
        return cachedResponse || fetch(event.request)
          .then((response) => {
            // Ensure the response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a stream and can only be used once
            const responseToCache = response.clone();
            
            // Cache the new response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, show a fallback page
            console.log('Service Worker: Fetch failed; returning offline page instead.');
            
            // You can return a custom offline page here
            // return caches.match('/offline.html');
          });
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Sync data function
async function syncData() {
  try {
    // Get all pending sync data from IndexedDB
    const pendingData = await getPendingSyncData();
    
    // Send data to server
    for (const data of pendingData) {
      await fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Remove data from pending sync store
      await removeSyncedData(data.id);
    }
    
    console.log('Sync completed successfully');
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}

// Mock functions for IndexedDB operations
async function getPendingSyncData() {
  // In a real app, this would fetch data from IndexedDB
  return [];
}

async function removeSyncedData(id) {
  // In a real app, this would remove data from IndexedDB
  return true;
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc/pc/super_tool/6ff112048c4b4df4bf823a3f2be33c76~tplv-a9rns2rl98-image.image?rcl=20251125160022B4FD00775976597CAC78&rk3s=8e244e95&rrcfp=f06b921b&x-expires=1766649636&x-signature=PELt4DSgXQjoZmI8YVCqfBfqp4A%3D',
      badge: 'https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc/pc/super_tool/6ff112048c4b4df4bf823a3f2be33c76~tplv-a9rns2rl98-image.image?rcl=20251125160022B4FD00775976597CAC78&rk3s=8e244e95&rrcfp=f06b921b&x-expires=1766649636&x-signature=PELt4DSgXQjoZmI8YVCqfBfqp4A%3D',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  // Close the notification
  event.notification.close();
  
  // Open the app or a specific page
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If the app is not open, open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});
