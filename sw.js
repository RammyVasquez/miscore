// Service worker: la app abre sin conexión.
// Estrategia: red primero (siempre ves la última versión) y, si no hay internet, lo guardado.
// Sube el número de VERSION si cambias la lista de archivos.
const VERSION = 'miscore-v14';
const SHELL = [
  "./",
  "index.html",
  "css/styles.css",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon.svg",
  "js/acciones.js",
  "js/actions.js",
  "js/auth.js",
  "js/charts.js",
  "js/cloud.js",
  "js/components.js",
  "js/config.js",
  "js/forms.js",
  "js/logic.js",
  "js/main.js",
  "js/render.js",
  "js/seed.js",
  "js/state.js",
  "js/ui.js",
  "js/util.js",
  "js/wizard.js",
  "js/vendor/supabase.js",
  "js/views/ajustes.js",
  "js/views/fijos.js",
  "js/views/gastos.js",
  "js/views/mas.js",
  "js/views/metas.js",
  "js/views/proyecciones.js",
  "js/views/quincena.js",
  "js/views/reportes.js",
  "js/views/resumen.js",
  "js/views/tarjetas.js",
  "js/views/vales.js",
  "js/views/welcome.js",
  "js/views/wizard.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(m => m || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
