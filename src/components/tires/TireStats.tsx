import { Package, Truck, Wrench, CircleDot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TireStatsProps {
  stats: {
    total: number;
    estoque: number;
    emUso: number;
    emReforma: number;
  };
}

export const TireStats = ({ stats }: TireStatsProps) => {
  const statCards = [
    {
      label: 'Total de Pneus',
      value: stats.total,
      icon: CircleDot,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Em Estoque',
      value: stats.estoque,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Em Uso',
      value: stats.emUso,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Em Reforma',
      value: stats.emReforma,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
