const CACHE="workout-v26";
const FILES=["./","./index.html","./manifest.webmanifest","./icon.svg","./css/style.css?v=26","./css/dashboard-layout.css?v=26","./css/activity-card.css?v=26","./js/storage.js?v=26","./js/routines.js?v=26","./js/timer.js?v=26","./js/journal.js?v=26","./js/app.js?v=26"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)))});
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 const isAppAsset=url.pathname.endsWith(".html")||url.pathname.endsWith(".js")||url.pathname.endsWith(".css");
 if(isAppAsset){
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html"))));
 }else{
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
 }
});