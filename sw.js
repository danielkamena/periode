const CACHE_NAME = 'periodex-v4'; // Incrémenté à V4 pour forcer la mise à jour de la nouvelle icône

// Liste des fichiers critiques à charger immédiatement
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Polices et Icones
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  
  // NOUVELLE ICÔNE PWA (chemin corrigé pour le dossier img)
  './img/icon-periodex.png', 
  
  // VOTRE PHOTO DE PROFIL 
  // Attention: Le nom de fichier avec des espaces et parenthèses est déconseillé
  './img/IMG-20241204-WA0034 (2).jpg' 
];

// 1. INSTALLATION : On met en cache les fichiers critiques
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache globale');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATION : On nettoie les anciens caches (v3, v2, etc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Suppression ancien cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); 
});

// 3. INTERCEPTION (FETCH) : Stratégie "Cache, puis Réseau avec mise en cache dynamique"
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        console.log("Pas de connexion et ressource non mise en cache");
        // Optionnel : Vous pourriez retourner une page d'erreur hors ligne personnalisée ici si vous en aviez une (ex: caches.match('./offline.html'))
      });
    })
  );
});