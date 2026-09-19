const CACHE='cadence-v1.5.1'; // keep in step with APP_VERSION in index.html
const ASSETS=[
  './','./index.html','./support.js','./manifest.json','./icon-192.png','./icon-512.png',
  './vendor/react.production.min.js','./vendor/react-dom.production.min.js'
];
// Cache entries one at a time: addAll() is atomic, so a single 404 would
// otherwise reject the whole precache and leave the app with nothing offline.
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});

// Cache-first, then revalidate in the background.
//
// Every asset is versioned by CACHE, so a cached hit is always correct for this
// build and there is no reason to make the user wait on the network to see it.
// Network-first meant each launch stalled on a round trip it did not need, which
// is exactly the case an offline-first app is supposed to avoid. A cached hit
// still refreshes itself afterwards, so the next launch picks up any change.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>{
    const fresh=fetch(e.request).then(r=>{
      // Cross-origin GETs are cached too (fonts), but opaque responses carry no
      // status, so only store what we can confirm is good.
      if(r&&(r.status===200||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp).catch(()=>{}));}
      return r;
    });
    if(hit){fresh.catch(()=>{});return hit;}
    // Nothing cached: wait on the network, and fall back to the app shell only
    // for navigations, so a missing script never resolves to HTML.
    return fresh.catch(()=>e.request.mode==='navigate'
      ?caches.match('./index.html').then(m=>m||Promise.reject(new Error('offline')))
      :Promise.reject(new Error('offline')));
  }));
});
