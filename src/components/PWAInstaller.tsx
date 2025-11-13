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
    // Check if already installed
    const checkInstallStatus = () => {
      // Check if running in standalone mode (installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
      const wasDismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = wasDismissed ? parseInt(wasDismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (isStandalone || isInWebAppiOS || wasInstalled) {
        setIsInstalled(true);
        setShowInstallBanner(false);
        return true;
      }
      
      // Don't show if dismissed recently (within 7 days)
      if (wasDismissed && daysSinceDismissed < 7) {
        return true;
      }
      
      return false;
    };
    
    if (checkInstallStatus()) {
      return;
    }
    
    const timer = setTimeout(() => {
      if (!checkInstallStatus()) {
        setShowInstallBanner(true);
      }
    }, 3000);
    
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
          setIsInstalled(true);
          localStorage.setItem('pwa-installed', 'true');
          localStorage.removeItem('pwa-install-dismissed');
        } else {
          handleDismiss();
        }
      } catch (error) {
        console.log('Install failed:', error);
        handleDismiss();
      }
    } else {
      // For browsers that don't support beforeinstallprompt
      setShowInstallBanner(false);
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };
  
  // Listen for app installed event
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('pwa-installed', 'true');
      localStorage.removeItem('pwa-install-dismissed');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  if (!showInstallBanner || isInstalled) return null;

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