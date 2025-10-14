import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Truck, FileText, XCircle, ThumbsUp, ThumbsDown, Bell, BarChart3, Timer, Download } from "lucide-react";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

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
    <div className="space-y-6">
      {isMechanic && <PWAInstallPrompt />}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isOperator ? 'Meu Painel' : isMechanic ? 'Painel do Mecânico' : 'Painel de Gestão'}
          </h2>
          <p className="text-gray-600">
            {isOperator 
              ? `Seus checklists e atividades - ${currentUser?.name}` 
              : isMechanic
              ? `Aprovações e análises - ${currentUser?.name}`
              : 'Visão geral das operações de hoje'}
          </p>
        </div>
        {isMechanic && data.pendingApprovals > 0 && (
          <div className="flex items-center gap-2 bg-safety-orange-light px-3 py-2 rounded-lg">
            <Bell className="w-4 h-4 text-safety-orange" />
            <span className="text-sm font-medium text-safety-orange">
              {data.pendingApprovals} aprovações pendentes
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
          <CardContent className="space-y-4">
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
                    <span className="text-sm text-gray-600">12 min</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Aprovações Hoje</span>
                    <span className="text-sm text-gray-600">15</span>
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
                    <span className="text-sm text-gray-600">{data.avgResponseTime} min</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Checklists Realizados</span>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-safety-orange" />
              Equipamentos com Mais Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topIssues.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-safety-orange-light rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-safety-orange">{index + 1}</span>
                    </div>
                    <span className="font-medium">{item.equipment}</span>
                  </div>
                  <Badge variant="secondary" className="bg-safety-orange-light text-safety-orange">
                    {item.issues} ocorrências
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-safety-orange" />
              Aprovações Pendentes
              {data.pendingApprovals > 0 && (
                <Badge className="bg-safety-orange text-white ml-2">
                  {data.pendingApprovals}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                  <div key={checklist.id} className={`p-4 border rounded-lg ${criticalityColor}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{checklist.equipmentCode} - {checklist.equipmentModel}</h4>
                          <Badge 
                            variant={criticality === 'crítico' ? 'destructive' : criticality === 'atenção' ? 'secondary' : 'outline'}
                            className={criticality === 'atenção' ? 'bg-safety-orange text-white' : ''}
                          >
                            {criticality === 'crítico' ? 'Crítico' : criticality === 'atenção' ? 'Atenção' : 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Operador: {checklist.operatorName}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(checklist.timestamp).toLocaleDateString('pt-BR')} às {' '}
                          {new Date(checklist.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="text-sm text-gray-700">
                          <span className="text-safety-green font-medium">{checklist.conformeItems} conformes</span>
                          {checklist.naoConformeItems > 0 && (
                            <span className="text-safety-red font-medium ml-2">{checklist.naoConformeItems} não conformes</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={handleQuickApprove}
                          className="bg-safety-green hover:bg-safety-green-dark text-white"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleQuickReject}
                          className="border-safety-red text-safety-red hover:bg-safety-red hover:text-white"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Negar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }) || []}
              {(!data.recentChecklists || data.recentChecklists.filter(c => c.status === 'pendente').length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
          <CardContent>
            {isOperator && data.recentChecklists ? (
              <div className="space-y-3">
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
                        return <Clock className="w-5 h-5 text-gray-400" />;
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
                    <div key={checklist.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      {getStatusIcon(checklist.status)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{checklist.equipmentCode} - {checklist.equipmentModel}</p>
                        <p className="text-sm text-gray-600">{formatDate(checklist.timestamp)}</p>
                        {checklist.status === 'negado' && checklist.rejections && checklist.rejections.length > 0 && (
                          <p className="text-sm text-safety-red mt-1">
                            Motivo: {checklist.rejections[checklist.rejections.length - 1].reason}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(checklist.status)}
                    </div>
                  );
                })}
                {data.recentChecklists.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nenhum checklist realizado ainda</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 border border-safety-red-light bg-safety-red-light rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-safety-red" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">EMP-045: Problema nos freios</p>
                    <p className="text-sm text-gray-600">Aguardando aprovação do mecânico • 15 min atrás</p>
                  </div>
                  <Badge variant="destructive">Crítico</Badge>
                </div>
                <div className="flex items-center gap-4 p-3 border border-safety-orange-light bg-safety-orange-light rounded-lg">
                  <Clock className="w-5 h-5 text-safety-orange" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">EMP-023: Luzes de sinalização</p>
                    <p className="text-sm text-gray-600">Aguardando aprovação do mecânico • 1h atrás</p>
                  </div>
                  <Badge className="bg-safety-orange text-white">Atenção</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;