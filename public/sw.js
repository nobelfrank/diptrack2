const CACHE_NAME = 'diptrack-v1';
const STATIC_CACHE = 'diptrack-static-v1';
const API_CACHE = 'diptrack-api-v1';

const ESSENTIAL_ASSETS = [
  '/offline.html',
  '/manifest.json'
];

const API_ROUTES = [
  '/api/batches',
  '/api/alerts', 
  '/api/qc/results',
  '/api/latex/field',
  '/api/latex/process',
  '/api/gloves',
  '/api/health'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('SW: Caching essential assets');
        return Promise.allSettled(
          ESSENTIAL_ASSETS.map(asset => 
            cache.add(asset).catch(err => 
              console.log(`SW: Failed to cache ${asset}:`, err)
            )
          )
        );
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle essential static assets only
  if (url.pathname === '/manifest.json' || url.pathname === '/offline.html') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests normally
  event.respondWith(fetch(request).catch(() => {
    return new Response('Offline', { status: 503 });
  }));
});

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline - cached data not available',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('SW: Navigation offline, serving offline page');
    
    // Serve offline page
    const cache = await caches.open(STATIC_CACHE);
    const offlineResponse = await cache.match('/offline.html');
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DipTrack - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: #0f172a;
              color: #e2e8f0;
            }
            .button {
              background: #8B5CF6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h1>DipTrack - Offline Mode</h1>
          <p>You're currently offline. Your data is stored locally.</p>
          <button class="button" onclick="window.location.reload()">Try Again</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first for static assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  const cache = await caches.open('offline-actions');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch (error) {
      console.log('Sync failed for:', request.url);
    }
  }
}