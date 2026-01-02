'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Verificar atualizações periodicamente
            setInterval(() => {
              registration.update();
            }, 60000); // A cada minuto
          })
          .catch((error) => {
            console.error('❌ Erro ao registrar Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}

