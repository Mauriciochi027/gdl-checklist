import { Truck, ClipboardCheck, BarChart3, Settings, Users, LogOut, Activity, LayoutDashboard, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { usePermissions } from "@/hooks/usePermissions";
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={gdlLogo} 
                alt="GDL Logo" 
                className="w-12 h-8 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">GDL CheckList</h1>
                <p className="text-sm text-gray-500">Sistema de Checklist Digital</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
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
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)]">
          {/* Company Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center text-center">
              <img 
                src={gdlLogo} 
                alt="GDL - Solução em movimento" 
                className="w-32 h-24 object-contain mb-3"
              />
              <h2 className="text-lg font-bold text-gray-900 mb-1">GDL</h2>
              <p className="text-xs text-gray-500">Solução em movimento</p>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map(item => {
              const Icon = item.icon;
              return <li key={item.id}>
                    <Button variant={currentPage === item.id ? "default" : "ghost"} className={cn("w-full justify-start gap-3", currentPage === item.id ? "bg-industrial-blue text-white hover:bg-industrial-blue-dark" : "text-gray-700 hover:bg-gray-100")} onClick={() => onPageChange(item.id)}>
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  </li>;
            })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>;
};
export default Layout;