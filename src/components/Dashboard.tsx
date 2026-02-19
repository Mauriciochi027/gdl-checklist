import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Truck, FileText, XCircle, ThumbsUp, ThumbsDown, Bell, BarChart3, Timer } from "lucide-react";

interface ChecklistRecord {
  id: string;
  equipmentCode: string;
  equipmentModel: string;
  operatorName: string;
  timestamp: string;
  status: 'conforme' | 'pendente' | 'negado';
  totalItems: number;
  conformeItems: number;
  naoConformeItems: number;
  signature: string;
  approvals?: Array<{ mechanicName: string; timestamp: string; comment: string; }>;
  rejections?: Array<{ mechanicName: string; timestamp: string; reason: string; }>;
}

interface DashboardProps {
  data: {
    totalEquipments: number;
    todayChecklists: number;
    pendingApprovals: number;
    nonConformItems: number;
    avgResponseTime: number;
    topIssues: Array<{ equipment: string; issues: number }>;
    recentAlerts?: Array<{ id: string; type: string; title: string; message: string; time: Date }>;
    recentChecklists?: ChecklistRecord[]; // Add recent checklists for operators
  };
  userProfile?: string;
  currentUser?: { name: string; matricula?: string };
  onApproveRecord?: (recordId: string, comment: string) => void;
  onRejectRecord?: (recordId: string, reason: string) => void;
}

const Dashboard = ({ data, userProfile, currentUser, onApproveRecord, onRejectRecord }: DashboardProps) => {
  const { toast } = useToast();
  // Operator dashboard shows only personal data
  const isOperator = userProfile === 'operador';
  const isMechanic = userProfile === 'mecanico' || userProfile === 'gestor';
  const stats = [
    {
      title: "Total de Equipamentos",
      value: data.totalEquipments,
      icon: Truck,
      color: "text-industrial-blue",
      bgColor: "bg-industrial-blue-light"
    },
    {
      title: "Checklists Hoje",
      value: data.todayChecklists,
      icon: CheckCircle,
      color: "text-safety-green",
      bgColor: "bg-safety-green-light"
    },
    {
      title: "Aprovações Pendentes",
      value: data.pendingApprovals,
      icon: Clock,
      color: "text-safety-orange",
      bgColor: "bg-safety-orange-light"
    },
    {
      title: "Itens Não Conformes",
      value: data.nonConformItems,
      icon: AlertTriangle,
      color: "text-safety-red",
      bgColor: "bg-safety-red-light"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
          {isOperator ? 'Meu Painel' : isMechanic ? 'Painel do Mecânico' : 'Painel de Gestão'}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isOperator 
            ? `Suas atividades` 
            : isMechanic
            ? `Aprovações e análises`
            : 'Visão geral das operações'}
        </p>
        {isMechanic && data.pendingApprovals > 0 && (
          <div className="flex items-center gap-2 bg-safety-orange-light px-2 py-1.5 rounded-lg w-fit">
            <Bell className="w-3.5 h-3.5 text-safety-orange flex-shrink-0" />
            <span className="text-xs font-medium text-safety-orange">
              {data.pendingApprovals} pendentes
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards - Otimizado para Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground line-clamp-2 mb-1">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Performance Metrics */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {isMechanic ? (
                <>
                  <BarChart3 className="w-5 h-5 text-safety-orange" />
                  Métricas de Aprovação
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-safety-green" />
                  Métricas de Performance
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {isMechanic ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Taxa de Aprovação</span>
                    <span className="text-sm text-safety-green font-semibold">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Tempo Médio de Análise</span>
                    <span className="text-sm text-muted-foreground">12 min</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Aprovações Hoje</span>
                    <span className="text-sm text-muted-foreground">15</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Taxa de Conformidade</span>
                    <span className="text-sm text-safety-green font-semibold">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Tempo Médio de Resposta</span>
                    <span className="text-sm text-muted-foreground">{data.avgResponseTime} min</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Checklists Realizados</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-safety-orange" />
              Equipamentos com Mais Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {data.topIssues.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-safety-orange-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-safety-orange">{index + 1}</span>
                    </div>
                    <span className="font-medium text-sm sm:text-base truncate">{item.equipment}</span>
                  </div>
                  <Badge variant="secondary" className="bg-safety-orange-light text-safety-orange text-xs whitespace-nowrap ml-2">
                    {item.issues}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mechanic Pending Approvals Section */}
      {isMechanic && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-5 h-5 text-safety-orange" />
              Aprovações Pendentes
              {data.pendingApprovals > 0 && (
                <Badge className="bg-safety-orange text-white ml-2">
                  {data.pendingApprovals}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {data.recentChecklists?.filter(c => c.status === 'pendente').slice(0, 5).map((checklist) => {
                const criticality = checklist.naoConformeItems > 2 ? 'crítico' : checklist.naoConformeItems > 0 ? 'atenção' : 'normal';
                const criticalityColor = criticality === 'crítico' ? 'border-safety-red bg-safety-red-light' : 
                                       criticality === 'atenção' ? 'border-safety-orange bg-safety-orange-light' : 
                                       'border-gray-200 bg-gray-50';

                const handleQuickApprove = () => {
                  if (onApproveRecord) {
                    onApproveRecord(checklist.id, 'Aprovado via ação rápida');
                    toast({
                      title: "Checklist Aprovado",
                      description: `Checklist ${checklist.equipmentCode} foi aprovado com sucesso.`,
                    });
                  }
                };

                const handleQuickReject = () => {
                  if (onRejectRecord) {
                    onRejectRecord(checklist.id, 'Negado via ação rápida - requer análise');
                    toast({
                      title: "Checklist Negado",
                      description: `Checklist ${checklist.equipmentCode} foi negado.`,
                      variant: "destructive",
                    });
                  }
                };

                return (
                  <div key={checklist.id} className={`p-2.5 sm:p-3 border rounded-lg ${criticalityColor}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <h4 className="font-medium text-xs sm:text-sm text-foreground">
                            {checklist.equipmentCode}
                          </h4>
                          <Badge 
                            variant={criticality === 'crítico' ? 'destructive' : criticality === 'atenção' ? 'secondary' : 'outline'}
                            className={cn(
                              "text-xs",
                              criticality === 'atenção' ? 'bg-safety-orange text-white' : ''
                            )}
                          >
                            {criticality === 'crítico' ? 'Crítico' : criticality === 'atenção' ? 'Atenção' : 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">Op: {checklist.operatorName}</p>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {new Date(checklist.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {' '}
                          {new Date(checklist.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="text-xs text-foreground flex flex-wrap gap-1.5">
                          <span className="text-safety-green font-medium">{checklist.conformeItems} ✓</span>
                          {checklist.naoConformeItems > 0 && (
                            <span className="text-safety-red font-medium">{checklist.naoConformeItems} ✗</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button 
                          size="sm" 
                          onClick={handleQuickApprove}
                          className="bg-safety-green hover:bg-safety-green-dark text-white flex-1 text-xs h-8"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleQuickReject}
                          className="border-safety-red text-safety-red hover:bg-safety-red hover:text-white flex-1 text-xs h-8"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Negar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }) || []}
              {(!data.recentChecklists || data.recentChecklists.filter(c => c.status === 'pendente').length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p>Nenhum checklist pendente de aprovação</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Checklists for Operators / Recent Alerts for Others */}
      {!isMechanic && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {isOperator ? (
                <>
                  <FileText className="w-5 h-5 text-industrial-blue" />
                  Meus Checklists Recentes
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-safety-red" />
                  Alertas Recentes
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isOperator && data.recentChecklists ? (
              <div className="space-y-2 sm:space-y-3">
                {data.recentChecklists.slice(0, 3).map((checklist) => {
                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case 'conforme':
                        return <CheckCircle className="w-5 h-5 text-safety-green" />;
                      case 'pendente':
                        return <Clock className="w-5 h-5 text-safety-orange" />;
                      case 'negado':
                        return <XCircle className="w-5 h-5 text-safety-red" />;
                      default:
                        return <Clock className="w-5 h-5 text-muted-foreground" />;
                    }
                  };

                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'conforme':
                        return <Badge className="bg-safety-green text-white">Aprovado</Badge>;
                      case 'pendente':
                        return <Badge className="bg-safety-orange text-white">Pendente</Badge>;
                      case 'negado':
                        return <Badge className="bg-safety-red text-white">Negado</Badge>;
                      default:
                        return <Badge variant="secondary">{status}</Badge>;
                    }
                  };

                  const formatDate = (timestamp: string) => {
                    const date = new Date(timestamp);
                    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  };

                  return (
                    <div key={checklist.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(checklist.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">{checklist.equipmentCode}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(checklist.timestamp)}</p>
                        {checklist.status === 'negado' && checklist.rejections && checklist.rejections.length > 0 && (
                          <div className="mt-1 p-1.5 bg-safety-red/10 rounded border-l-2 border-safety-red">
                            <p className="text-xs text-safety-red font-medium">
                              Negado por: {checklist.rejections[checklist.rejections.length - 1].mechanicName}
                            </p>
                            <p className="text-xs text-safety-red">
                              Motivo: {checklist.rejections[checklist.rejections.length - 1].reason}
                            </p>
                          </div>
                        )}
                        {checklist.status === 'conforme' && checklist.approvals && checklist.approvals.length > 0 && (
                          <div className="mt-1 p-1.5 bg-safety-green/10 rounded border-l-2 border-safety-green">
                            <p className="text-xs text-safety-green font-medium">
                              Aprovado por: {checklist.approvals[checklist.approvals.length - 1].mechanicName}
                            </p>
                            {checklist.approvals[checklist.approvals.length - 1].comment && (
                              <p className="text-xs text-muted-foreground">
                                {checklist.approvals[checklist.approvals.length - 1].comment}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(checklist.status)}
                    </div>
                  );
                })}
                {data.recentChecklists.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum checklist realizado ainda</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentAlerts && data.recentAlerts.length > 0 ? (
                  data.recentAlerts.map((alert) => {
                    const Icon = alert.type === 'error' ? XCircle : Clock;
                    const bgColor = alert.type === 'error' ? 'border-safety-red-light bg-safety-red-light' : 'border-safety-orange-light bg-safety-orange-light';
                    const iconColor = alert.type === 'error' ? 'text-safety-red' : 'text-safety-orange';
                    const badgeClass = alert.type === 'error' ? 'bg-safety-red text-white' : 'bg-safety-orange text-white';

                    return (
                      <div key={alert.id} className={`flex items-center gap-4 p-3 border rounded-lg ${bgColor}`}>
                        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.message} • {new Date(alert.time).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Badge className={badgeClass}>{alert.type === 'error' ? 'Crítico' : 'Atenção'}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">Nenhum alerta recente</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;