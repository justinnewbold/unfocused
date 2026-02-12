// UnFocused Service Worker - Offline support
const CACHE_NAME = 'unfocused-v1'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
]

// Install: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls (Supabase, AI APIs)
  const url = new URL(request.url)
  if (url.hostname.includes('supabase') || url.hostname.includes('anthropic') || url.hostname.includes('openai')) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached

          // For navigation requests, return the cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }

          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})
