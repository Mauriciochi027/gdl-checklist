import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-industrial-blue mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Instalar Aplicativo</h3>
          <p className="text-sm text-gray-600 mb-3">
            Instale o GDL CheckList no seu dispositivo para acesso rápido e uso offline.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={handleInstall}
              size="sm"
              className="bg-industrial-blue hover:bg-industrial-blue-dark"
            >
              Instalar
            </Button>
            <Button 
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              Agora não
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};
