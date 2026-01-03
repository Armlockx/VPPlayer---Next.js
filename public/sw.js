const CACHE_NAME = 'vp-player-v1';
const urlsToCache = [
  '/',
  '/globals.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao fazer cache:', error);
      })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições com schemes não suportados (chrome-extension, etc)
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Ignorar requisições para APIs externas
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('googletagmanager.com') ||
      event.request.url.includes('google-analytics.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verificar novamente se é uma requisição válida antes de fazer cache
        const requestUrl = new URL(event.request.url);
        const isValidRequest = 
          (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') &&
          !requestUrl.href.includes('chrome-extension:') &&
          !requestUrl.href.includes('chrome://') &&
          !requestUrl.href.includes('moz-extension:') &&
          response.status === 200 &&
          response.type !== 'error';

        // Adicionar ao cache apenas se for uma requisição válida
        if (isValidRequest) {
          try {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch((error) => {
                // Ignorar erros de cache silenciosamente
                console.warn('Service Worker: Erro ao fazer cache:', error);
              });
            });
          } catch (error) {
            // Ignorar erros de clonagem silenciosamente
            console.warn('Service Worker: Erro ao clonar resposta:', error);
          }
        }

        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }

          // Se não encontrar no cache e for uma navegação, retornar página inicial
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

