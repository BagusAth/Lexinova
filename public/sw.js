// Service worker Lexinova: aplikasi tetap bisa dibuka tanpa internet.
// - Aset statis Next (/_next/static) dan ikon: cache-first (namanya sudah ber-hash).
// - Halaman: network-first, jatuh ke cache saat offline.
// - Permintaan ke domain lain (mis. LanguageTool) tidak disentuh.

const VERSION = "v1";
const CACHE = `lexinova-${VERSION}`;
const PAGES = ["/", "/fondasi", "/listening", "/reading", "/writing", "/speaking", "/conversation", "/hasil", "/pengaturan"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(PAGES.map((p) => c.add(p))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("lexinova-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Halaman dan data RSC: coba jaringan dulu, simpan salinannya untuk offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/") : Response.error()))),
  );
});
