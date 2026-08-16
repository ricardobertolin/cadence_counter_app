const CACHE='cadence-v1.3.0'; // keep in step with APP_VERSION in index.html
const ASSETS=['./','./index.html','./support.js','./manifest.json','./icon-192.png','./icon-512.png'];
// Cache entries one at a time: addAll() is atomic, so a single 404 would
// otherwise reject the whole precache and leave the app with nothing offline.
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  // Network-first, falling back to cache. Cross-origin GETs are cached too so
  // the React UMD bundle survives offline; only navigations fall back to the
  // app shell, so a missing script never resolves to HTML.
  e.respondWith(
    fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp).catch(()=>{}));return r;})
    .catch(()=>caches.match(e.request).then(m=>m||(e.request.mode==='navigate'?caches.match('./index.html'):Promise.reject(new Error('offline')))))
  );
});
