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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={gdlLogo} 
                alt="GDL Logo" 
                className="w-8 h-6 sm:w-12 sm:h-8 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">GDL CheckList</h1>
                <p className="text-xs sm:text-sm text-gray-500">Sistema de Checklist Digital</p>
              </div>
              <h1 className="text-base font-bold text-gray-900 sm:hidden">GDL</h1>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{user?.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${profileBadge.color}`}>
                    {profileBadge.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user?.matricula && `Matrícula: ${user.matricula}`}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3">
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

        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Close button for mobile */}
          <div className="lg:hidden flex justify-end p-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Company Logo Section */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col items-center text-center">
              <img 
                src={gdlLogo} 
                alt="GDL - Solução em movimento" 
                className="w-24 h-18 sm:w-32 sm:h-24 object-contain mb-2 sm:mb-3"
              />
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">GDL</h2>
              <p className="text-xs text-gray-500">Solução em movimento</p>
            </div>
          </div>
          
          <nav className="p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <ul className="space-y-1 sm:space-y-2">
              {menuItems.map(item => {
              const Icon = item.icon;
              return <li key={item.id}>
                    <Button 
                      variant={currentPage === item.id ? "default" : "ghost"} 
                      className={cn(
                        "w-full justify-start gap-2 sm:gap-3 text-sm sm:text-base h-10 sm:h-11", 
                        currentPage === item.id 
                          ? "bg-industrial-blue text-white hover:bg-industrial-blue-dark" 
                          : "text-gray-700 hover:bg-gray-100"
                      )} 
                      onClick={() => {
                        onPageChange(item.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </li>;
            })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-64px)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>;
};
export default Layout;