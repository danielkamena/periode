const CACHE_NAME = 'periodex-v3'; // J'incrémente la version (v3) pour forcer le rafraîchissement
                                  // et la prise en compte de la nouvelle icône chez les utilisateurs.

// Liste des fichiers critiques à charger immédiatement
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // VOTRE NOUVELLE ICÔNE PWA PROFESSIONNELLE AJOUTÉE ICI
  './icon-pwa.png', 
  // Polices et Icones
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  // L'ANCIENNE ICÔNE FLATICON A ÉTÉ SUPPRIMÉE
  
  // VOTRE PHOTO DE PROFIL (Attention au chemin exact)
  // Il est préférable de renommer votre image sans espaces ni parenthèses
  // Si vous gardez le nom actuel, assurez-vous qu'il correspond exactement au dossier img
  './img/IMG-20241204-WA0034 (2).jpg' 
];

// 1. INSTALLATION : On met en cache les fichiers critiques
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force le SW à s'activer immédiatement
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache globale');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATION : On nettoie les anciens caches (v2, etc.)
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
  return self.clients.claim(); // Prend le contrôle de la page immédiatement
});

// 3. INTERCEPTION (FETCH) : Stratégie "Cache, puis Réseau avec mise en cache dynamique"
self.addEventListener('fetch', (event) => {
  // On ignore les requêtes non-GET ou vers d'autres protocoles (chrome-extension, etc)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si on trouve dans le cache, on retourne le cache (Vitesse max)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon, on va chercher sur Internet
      return fetch(event.request).then((networkResponse) => {
        // Vérification que la réponse est valide
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // IMPORTANT : On clone la réponse pour la mettre dans le cache
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Si tout échoue (Pas d'internet ET pas en cache)
        console.log("Pas de connexion et ressource non mise en cache");
        // Optionnel : On pourrait retourner une page "Hors ligne" ici
      });
    })
  );
});