/* Service worker do Soberano.
   Guarda o app (telas, estilos, logo) para abrir rápido e funcionar sem internet.
   Os DADOS ficam na nuvem (Supabase). O service worker só guarda o app em si.
   Ao publicar uma versão nova, troque o número do CACHE abaixo (v1 -> v2 ...). */
const CACHE = "soberano-nuvem-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./supabase.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  // Para navegação (abrir o app): tenta a internet, se falhar usa o que está guardado.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }
  // Demais arquivos: usa o guardado primeiro, e atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
