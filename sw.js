
const CACHE_NAME = 'mx-tv-cache-v3';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-1024.png',
  './lists/mx_regionales.m3u', './lists/mx_documentales_nocturnos.m3u', './lists/intl_publicos.m3u'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME && caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(r=> r || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c=>c.put(req, copy));
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
