// Service worker: deja la app usable sin internet.
// - Páginas y datos de navegación: red primero, cache de respaldo.
// - Assets estáticos (hasheados): cache primero.
// Las llamadas a Supabase (otro origen) no se interceptan.

const VERSION = "v1";
const CACHE = `frodev-${VERSION}`;

const SHELL = [
  "/",
  "/gym",
  "/finanzas",
  "/finanzas/gastos",
  "/finanzas/entradas",
  "/finanzas/deudas",
  "/finanzas/estadisticas",
  "/finanzas/lista",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase pasa directo

  // Estáticos inmutables e íconos: cache primero.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // Todo lo demás (páginas, payloads de navegación): red primero, cache de respaldo.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // Navegación a una página no cacheada: probar por ruta y caer al inicio.
        if (req.mode === "navigate") {
          return (
            (await caches.match(url.pathname)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        }
        return Response.error();
      })
  );
});
