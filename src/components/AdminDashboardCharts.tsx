import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Timer, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

interface ChecklistRecord {
  id: string;
  equipmentCode: string;
  equipmentModel: string;
  operatorName: string;
  timestamp: string;
  status: string;
  totalItems: number;
  conformeItems: number;
  naoConformeItems: number;
  approvals?: Array<{ mechanicName: string; timestamp: string; comment?: string }>;
  rejections?: Array<{ mechanicName: string; timestamp: string; reason: string }>;
}

interface AdminDashboardChartsProps {
  checklistRecords: ChecklistRecord[];
}

const COLORS = {
  green: 'hsl(142, 76%, 36%)',
  red: 'hsl(0, 84%, 60%)',
  orange: 'hsl(16, 85%, 55%)',
  blue: 'hsl(200, 18%, 46%)',
  gray: 'hsl(220, 13%, 64%)',
};

export const AdminDashboardCharts = ({ checklistRecords }: AdminDashboardChartsProps) => {
  const stats = useMemo(() => {
    const total = checklistRecords.length;
    const approved = checklistRecords.filter(r => r.status === 'conforme').length;
    const rejected = checklistRecords.filter(r => r.status === 'negado').length;
    const pending = checklistRecords.filter(r => r.status === 'pendente').length;

    // Approval rate
    const responded = approved + rejected;
    const approvalRate = responded > 0 ? Math.round((approved / responded) * 100) : 0;
    const rejectionRate = responded > 0 ? Math.round((rejected / responded) * 100) : 0;

    // Response rate (% of checklists that got a response)
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    // SLA: average time from checklist submission to approval/rejection (in minutes)
    const responseTimes: number[] = [];
    checklistRecords.forEach(r => {
      const created = new Date(r.timestamp).getTime();
      if (r.approvals?.length) {
        const responseTime = (new Date(r.approvals[0].timestamp).getTime() - created) / (1000 * 60);
        if (responseTime > 0 && responseTime < 10080) responseTimes.push(responseTime); // max 7 days
      }
      if (r.rejections?.length) {
        const responseTime = (new Date(r.rejections[0].timestamp).getTime() - created) / (1000 * 60);
        if (responseTime > 0 && responseTime < 10080) responseTimes.push(responseTime);
      }
    });

    const avgSlaMinutes = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const slaFormatted = avgSlaMinutes >= 60
      ? `${Math.floor(avgSlaMinutes / 60)}h ${avgSlaMinutes % 60}m`
      : `${avgSlaMinutes} min`;

    // Within SLA (< 2 hours)
    const withinSla = responseTimes.filter(t => t <= 120).length;
    const slaRate = responseTimes.length > 0 ? Math.round((withinSla / responseTimes.length) * 100) : 0;

    // Daily data for last 7 days
    const dailyData: Array<{ day: string; total: number; aprovados: number; negados: number; pendentes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRecords = checklistRecords.filter(r => {
        const t = new Date(r.timestamp).getTime();
        return t >= date.getTime() && t < nextDay.getTime();
      });

      dailyData.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        total: dayRecords.length,
        aprovados: dayRecords.filter(r => r.status === 'conforme').length,
        negados: dayRecords.filter(r => r.status === 'negado').length,
        pendentes: dayRecords.filter(r => r.status === 'pendente').length,
      });
    }

    // Top approvers
    const approverMap = new Map<string, { approved: number; rejected: number }>();
    checklistRecords.forEach(r => {
      r.approvals?.forEach(a => {
        const existing = approverMap.get(a.mechanicName) || { approved: 0, rejected: 0 };
        existing.approved++;
        approverMap.set(a.mechanicName, existing);
      });
      r.rejections?.forEach(rej => {
        const existing = approverMap.get(rej.mechanicName) || { approved: 0, rejected: 0 };
        existing.rejected++;
        approverMap.set(rej.mechanicName, existing);
      });
    });

    const topApprovers = Array.from(approverMap.entries())
      .map(([name, data]) => ({ name, ...data, total: data.approved + data.rejected }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Pie data
    const pieData = [
      { name: 'Aprovados', value: approved, color: COLORS.green },
      { name: 'Negados', value: rejected, color: COLORS.red },
      { name: 'Pendentes', value: pending, color: COLORS.orange },
    ].filter(d => d.value > 0);

    return {
      total, approved, rejected, pending, approvalRate, rejectionRate,
      responseRate, avgSlaMinutes, slaFormatted, slaRate,
      dailyData, topApprovers, pieData
    };
  }, [checklistRecords]);

  const statCards = [
    {
      title: 'Total de Checklists',
      value: stats.total,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Aprovados',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-safety-green',
      bgColor: 'bg-safety-green-light',
      badge: `${stats.approvalRate}%`,
      badgeColor: 'bg-safety-green text-white',
    },
    {
      title: 'Negados',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-safety-red',
      bgColor: 'bg-safety-red-light',
      badge: `${stats.rejectionRate}%`,
      badgeColor: 'bg-safety-red text-white',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-safety-orange',
      bgColor: 'bg-safety-orange-light',
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                  {stat.badge && (
                    <Badge className={`text-xs ${stat.badgeColor}`}>{stat.badge}</Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SLA + Response Rate Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Timer className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">SLA Médio de Resposta</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.slaFormatted}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio entre envio e resposta
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-safety-green-light flex items-center justify-center">
                <Activity className="w-4 h-4 text-safety-green" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Dentro do SLA (≤2h)</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.slaRate}%</p>
            <Progress value={stats.slaRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Taxa de Retorno</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.responseRate}%</p>
            <Progress value={stats.responseRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Bar Chart - Checklists por dia */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="w-4 h-4 text-primary" />
              Checklists nos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="aprovados" name="Aprovados" fill={COLORS.green} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="negados" name="Negados" fill={COLORS.red} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="pendentes" name="Pendentes" fill={COLORS.orange} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribuição de Status */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="w-4 h-4 text-primary" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
              {stats.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 91%)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {stats.pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Line + Top Approvers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Trend Line */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 text-safety-green" />
              Tendência Diária
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="total" name="Total" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="aprovados" name="Aprovados" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Approvers */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="w-4 h-4 text-primary" />
              Ranking de Aprovadores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {stats.topApprovers.length > 0 ? (
              <div className="space-y-3">
                {stats.topApprovers.map((approver, index) => (
                  <div key={approver.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{approver.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-safety-green">{approver.approved} ✓</span>
                        <span className="text-safety-red">{approver.rejected} ✗</span>
                        <span>Total: {approver.total}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {approver.total > 0 ? Math.round((approver.approved / approver.total) * 100) : 0}% aprov.
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum aprovador registrado ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
