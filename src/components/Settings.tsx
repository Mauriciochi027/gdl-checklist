import { motion } from 'framer-motion';
import { Smartphone, Download, Info, Moon, Sun, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function Settings() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast.success('App instalado com sucesso!');
      }
      setDeferredPrompt(null);
    } else {
      toast.info('Para instalar, use o menu do navegador');
    }
  };

  const handleExportData = () => {
    const data = localStorage.getItem('finance_transactions');
    if (!data) {
      toast.info('Nenhum dado para exportar');
      return;
    }
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados!');
  };

  const handleClearData = () => {
    localStorage.removeItem('finance_transactions');
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-6 pb-24 space-y-6"
    >
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <div className="space-y-4">
        {/* Install App */}
        {!isInstalled && (
          <div className="stat-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Instalar App</p>
                <p className="text-xs text-muted-foreground">Acesse offline e na tela inicial</p>
              </div>
            </div>
            <Button onClick={handleInstall} variant="outline" size="sm">
              Instalar
            </Button>
          </div>
        )}

        {/* Export Data */}
        <div className="stat-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Exportar Dados</p>
              <p className="text-xs text-muted-foreground">Baixe seus dados em JSON</p>
            </div>
          </div>
          <Button onClick={handleExportData} variant="outline" size="sm">
            Exportar
          </Button>
        </div>

        {/* Clear Data */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="stat-card flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Limpar Dados</p>
                  <p className="text-xs text-muted-foreground">Apagar todas as transações</p>
                </div>
              </div>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as suas transações serão permanentemente excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                Limpar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* About */}
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Sobre</p>
              <p className="text-xs text-muted-foreground">Finança Pessoal v1.0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-8">
        <p>Desenvolvido com ❤️</p>
        <p className="mt-1">Seus dados são armazenados localmente</p>
      </div>
    </motion.div>
  );
}
