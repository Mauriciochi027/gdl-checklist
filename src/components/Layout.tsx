import { Truck, ClipboardCheck, BarChart3, Settings, Users, LogOut, Activity, LayoutDashboard, CheckSquare, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";
import gdlLogo from "@/assets/gdl-logo.png";
interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}
const Layout = ({
  children,
  currentPage,
  onPageChange
}: LayoutProps) => {
  const { user, logout } = useAuth();
  const { canAccess } = usePermissions(user);
  // Sidebar sempre começa fechado em mobile, aberto em desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define todos os itens de menu possíveis
  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'DashBoard',
      icon: BarChart3,
      permission: 'dashboard' as const
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      permission: 'users' as const
    },
    {
      id: 'status',
      label: 'Status',
      icon: Activity,
      permission: 'status' as const
    },
    {
      id: 'equipments',
      label: 'Equipamentos',
      icon: Truck,
      permission: 'equipments' as const
    },
    {
      id: 'equipment-management',
      label: 'Painel',
      icon: LayoutDashboard,
      permission: 'equipment-management' as const
    },
    {
      id: 'checklist',
      label: 'Checklist',
      icon: ClipboardCheck,
      permission: 'checklist' as const
    },
    {
      id: 'approvals',
      label: 'Aprovações',
      icon: CheckSquare,
      permission: 'approvals' as const
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: Settings,
      permission: 'history' as const
    }
  ];

  // Filtrar itens de menu baseado nas permissões do usuário
  const menuItems = allMenuItems.filter(item => canAccess(item.permission));
  const getProfileBadge = (profile: string) => {
    const badges = {
      operador: {
        label: 'Operador',
        color: 'bg-industrial-blue'
      },
      mecanico: {
        label: 'Mecânico',
        color: 'bg-safety-orange'
      },
      gestor: {
        label: 'Gestor',
        color: 'bg-purple-600'
      },
      admin: {
        label: 'Admin',
        color: 'bg-red-600'
      }
    };
    return badges[profile as keyof typeof badges] || {
      label: profile,
      color: 'bg-gray-500'
    };
  };
  const profileBadge = getProfileBadge(user?.profile || '');
  return <div className="min-h-screen bg-background">
      {/* Header - Otimizado para Mobile */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-3 py-2 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden p-2 h-9 w-9"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo and Title - Compacto para mobile */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src={gdlLogo} 
                alt="GDL Logo" 
                className="w-8 h-6 sm:w-10 sm:h-7 object-contain flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">GDL CheckList</h1>
                <p className="text-xs text-gray-500 hidden sm:block truncate">Sistema de Checklist Digital</p>
              </div>
            </div>

            {/* User Info and Logout - Otimizado */}
            <div className="flex items-center gap-2">
              {/* User badge - só visível em telas maiores */}
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{user?.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${profileBadge.color} whitespace-nowrap`}>
                      {profileBadge.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {user?.matricula && `Mat: ${user.matricula}`}
                  </span>
                </div>
              </div>
              
              {/* Logout button compacto */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout} 
                className="h-8 w-8 p-0 sm:w-auto sm:px-3"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Otimizado para Mobile */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Close button for mobile */}
          <div className="lg:hidden flex justify-between items-center p-3 border-b">
            <span className="text-sm font-semibold text-gray-900">Menu</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User info em mobile - visível apenas quando sidebar aberto */}
          <div className="lg:hidden p-3 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.matricula && `Matrícula: ${user.matricula}`}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full text-white ${profileBadge.color} whitespace-nowrap`}>
                {profileBadge.label}
              </span>
            </div>
          </div>

          {/* Company Logo Section - Compacto */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col items-center text-center">
              <img 
                src={gdlLogo} 
                alt="GDL - Solução em movimento" 
                className="w-20 h-15 sm:w-24 sm:h-18 object-contain mb-2"
              />
              <h2 className="text-base font-bold text-gray-900">GDL</h2>
              <p className="text-xs text-gray-500">Solução em movimento</p>
            </div>
          </div>
          
          {/* Navigation - Otimizado */}
          <nav className="p-3 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button 
                  key={item.id}
                  variant={isActive ? "default" : "ghost"} 
                  className={cn(
                    "w-full justify-start gap-3 text-sm h-11 px-3", 
                    isActive 
                      ? "bg-industrial-blue text-white hover:bg-industrial-blue-dark" 
                      : "text-gray-700 hover:bg-gray-100"
                  )} 
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false); // Fecha sidebar após clicar
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content - Otimizado para Mobile */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-64px)] overflow-x-hidden w-full">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>;
};
export default Layout;