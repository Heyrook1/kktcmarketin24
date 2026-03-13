const CACHE_NAME = "marketin24-v1"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first strategy for navigation, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== location.origin) return

  // Images: cache-first
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((resp) => {
          const clone = resp.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          return resp
        })
      })
    )
    return
  }

  // Navigation: network-first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
  }
})
