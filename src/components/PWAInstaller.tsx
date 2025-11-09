'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowInstallBanner(true), 3000);
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installHandler = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
          localStorage.setItem('pwa-installed', 'true');
        }
      } catch (error) {
        console.log('Install failed:', error);
      }
    } else {
      // Force install simulation
      setShowInstallBanner(false);
      localStorage.setItem('pwa-installed', 'true');
      
      // Try to trigger native install
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          // Simulate successful install
          window.dispatchEvent(new Event('appinstalled'));
        });
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-top">
      <div className="flex items-start gap-3">
        {isIOS ? <Smartphone className="w-5 h-5 text-primary mt-0.5" /> : <Download className="w-5 h-5 text-primary mt-0.5" />}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install DipTrack</h3>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mb-3">
              Tap Share → Add to Home Screen for better experience
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mb-3">
              Install for offline access and app-like experience
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstall} className="flex-1">
              Install App
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}