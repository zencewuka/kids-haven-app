// Offline support. The build step (scripts/make-sw.mjs) fills in the file list and version.
const VERSION = "__VERSION__"
const CACHE = "kh-" + VERSION
const PRECACHE = /*__PRECACHE__*/ []
const scope = self.registration.scope

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE.map((p) => new Request(new URL(p, scope), { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kh-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true })
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok && res.status === 200) cache.put(req, res.clone())
          return res
        })
        .catch(() => null)
      if (hit) {
        event.waitUntil(refresh)
        return hit
      }
      const res = await refresh
      if (res) return res
      if (req.mode === "navigate") return (await cache.match(new URL("index.html", scope))) || Response.error()
      return Response.error()
    }),
  )
})
