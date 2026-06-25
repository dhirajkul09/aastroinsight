// AstroInsight Service Worker v1.0
const CACHE = 'aastroinsight-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Mukta:wght@400;600;700&family=Cinzel:wght@400;600&display=swap',
];

// Install — pre-cache core assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(PRECACHE.map(function(url){
        return new Request(url, {mode:'no-cors'});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e){
  // Skip Firebase / external API calls — always live
  if(e.request.url.includes('firebaseapp') ||
     e.request.url.includes('firestore') ||
     e.request.url.includes('googleapis.com/identitytoolkit') ||
     e.request.url.includes('wa.me')){
    return;
  }

  e.respondWith(
    fetch(e.request).then(function(res){
      // Cache successful GET responses
      if(e.request.method === 'GET' && res.status === 200){
        var resClone = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(e.request, resClone); });
      }
      return res;
    }).catch(function(){
      // Network failed — serve from cache
      return caches.match(e.request).then(function(cached){
        if(cached) return cached;
        // For navigation requests show offline page
        if(e.request.mode === 'navigate'){
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Push notifications (future use)
self.addEventListener('push', function(e){
  if(!e.data) return;
  var data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Astro\'s Insight', {
      body: data.body || 'नया संदेश आया है',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data,
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
