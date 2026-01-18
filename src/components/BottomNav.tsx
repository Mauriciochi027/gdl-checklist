import { Home, ListOrdered, BarChart3, Plus, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'transactions' | 'add' | 'reports' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home' as Tab, icon: Home, label: 'Início' },
    { id: 'transactions' as Tab, icon: ListOrdered, label: 'Transações' },
    { id: 'add' as Tab, icon: Plus, label: 'Adicionar', isAction: true },
    { id: 'reports' as Tab, icon: BarChart3, label: 'Relatórios' },
    { id: 'settings' as Tab, icon: Settings, label: 'Config' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className="floating-action-btn -mt-8 shadow-elevated"
              >
                <Icon className="w-6 h-6" />
              </motion.button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'nav-item relative flex-1 max-w-[80px]',
                isActive && 'nav-item-active'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-xs transition-colors',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
