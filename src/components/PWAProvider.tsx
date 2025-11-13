'use client'

import { useEffect } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ SW registered:', registration.scope);
          
          // Force update check
          registration.update();
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('🔄 SW update found');
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🆕 New content available, refresh to update');
                  // Could show update notification here
                }
              });
            }
          });
          
          // Listen for SW messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('📨 SW message:', event.data);
          });
        })
        .catch((error) => {
          console.error('❌ SW registration failed:', error);
        });
        
      // Handle SW controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 SW controller changed');
        window.location.reload();
      });
    } else {
      console.warn('⚠️ Service Worker not supported');
    }
  }, []);

  return <>{children}</>;
}