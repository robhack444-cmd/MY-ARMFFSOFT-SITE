// Service Worker with Strategic Caching
const CACHE_NAME = 'armffsoft-v3.2.1';
const API_CACHE = 'armffsoft-api-v1';

// Critical Assets - Cache First
const CRITICAL_ASSETS = [
    '/',
    '/css/critical.css',
    '/js/runtime.js',
    '/fonts/Geist-Bold.woff2',
    '/manifest.json'
];

// API Endpoints - Network First
const API_ENDPOINTS = [
    '/api/products',
    '/api/user/profile',
    '/api/orders'
];

// Install Event - Cache Critical Assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CRITICAL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Advanced Strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // API Requests - Network First
    if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful API responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(API_CACHE)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache when offline
                    return caches.match(request);
                })
        );
        return;
    }

    // Static Assets - Cache First
    if (request.destination === 'style' || request.destination === 'script' || 
        request.destination === 'font' || request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        // Update cache in background
                        event.waitUntil(
                            fetch(request).then(response => {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, response));
                            })
                        );
                        return cachedResponse;
                    }
                    return fetch(request)
                        .then(response => {
                            // Cache new assets
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // Default - Network First
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// Background Sync for Offline Actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-payment') {
        event.waitUntil(doBackgroundPaymentSync());
    }
});

async function doBackgroundPaymentSync() {
    const db = await openPaymentDB();
    const pendingPayments = await db.getAll('pending-payments');
    
    for (const payment of pendingPayments) {
        try {
            await fetch('/api/payments/process', {
                method: 'POST',
                body: JSON.stringify(payment.data),
                headers: { 'Content-Type': 'application/json' }
            });
            await db.delete('pending-payments', payment.id);
        } catch (error) {
            console.error('Background sync failed:', error);
        }
    }
}