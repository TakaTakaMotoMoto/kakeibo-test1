// Service Worker for PWA functionality
const CACHE_NAME = 'budget-app-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './styles/main.css',
    './js/storage.js',
    './js/data.js',
    './js/ui.js',
    './js/charts.js',
    './js/calendar.js',
    './js/app.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Failed to cache resources:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a stream
                    const responseToCache = response.clone();
                    
                    // Add to cache for future use
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch((error) => {
                    console.error('Fetch failed:', error);
                    
                    // Return offline page for navigation requests
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                    
                    throw error;
                });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '開く',
                icon: '/icons/icon-192x192.png'
            },
            {
                action: 'close',
                title: '閉じる',
                icon: '/icons/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('家計簿アプリ', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('./')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Background sync function
async function doBackgroundSync() {
    try {
        console.log('Performing background sync...');
        
        // Here you could sync offline data with a server
        // For now, we'll just log that sync was performed
        
        // Example: Send offline transactions to server
        // const offlineTransactions = await getOfflineTransactions();
        // await sendTransactionsToServer(offlineTransactions);
        
        console.log('Background sync completed');
        return Promise.resolve();
    } catch (error) {
        console.error('Background sync failed:', error);
        return Promise.reject(error);
    }
}

// Utility functions for cache management
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
    
    return Promise.all(
        oldCaches.map(name => caches.delete(name))
    );
}

async function updateCache() {
    const cache = await caches.open(CACHE_NAME);
    return cache.addAll(urlsToCache);
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'budget-sync') {
            event.waitUntil(doBackgroundSync());
        }
    });
}

console.log('Service Worker loaded successfully');