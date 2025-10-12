import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit2, Eye, Clock, Wrench, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

import { Equipment, ChecklistRecord } from '@/types/equipment';

interface StatusPanelProps {
  equipments: Equipment[];
  checklistRecords: ChecklistRecord[];
  userProfile?: 'operador' | 'mecanico' | 'gestor' | 'admin';
  onUpdateEquipmentStatus?: (equipmentId: string, status: string, reason?: string) => void;
}

const StatusPanel = ({ equipments, checklistRecords, userProfile, onUpdateEquipmentStatus }: StatusPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const canEdit = userProfile === 'mecanico' || userProfile === 'gestor';

  // Simular carregamento inicial
  useEffect(() => {
    if (equipments.length > 0) {
      setIsLoading(false);
    }
  }, [equipments]);

  // Função para determinar o status baseado no banco de dados e nos checklists
  const getEquipmentStatus = (equipmentCode: string): { status: 'disponivel' | 'operando' | 'manutencao'; label: string; color: string; bgColor: string; icon: React.ReactNode } => {
    // Primeiro verifica o status direto do equipamento no banco
    const equipment = equipments.find(eq => eq.code === equipmentCode);
    
    // Mapear status do banco para status de exibição
    if (equipment?.status) {
      const statusMap: Record<string, { status: 'disponivel' | 'operando' | 'manutencao'; label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
        'disponivel': {
          status: 'disponivel',
          label: 'Disponível',
          color: 'text-white',
          bgColor: 'bg-safety-green',
          icon: <CheckCircle className="w-4 h-4" />
        },
        'active': {
          status: 'disponivel',
          label: 'Disponível',
          color: 'text-white',
          bgColor: 'bg-safety-green',
          icon: <CheckCircle className="w-4 h-4" />
        },
        'operando': {
          status: 'operando',
          label: 'Operando',
          color: 'text-white',
          bgColor: 'bg-industrial-blue',
          icon: <Clock className="w-4 h-4" />
        },
        'manutencao': {
          status: 'manutencao',
          label: 'Em Manutenção',
          color: 'text-white',
          bgColor: 'bg-safety-red',
          icon: <Wrench className="w-4 h-4" />
        },
        'maintenance': {
          status: 'manutencao',
          label: 'Em Manutenção',
          color: 'text-white',
          bgColor: 'bg-safety-red',
          icon: <Wrench className="w-4 h-4" />
        },
        'inactive': {
          status: 'manutencao',
          label: 'Em Manutenção',
          color: 'text-white',
          bgColor: 'bg-safety-red',
          icon: <Wrench className="w-4 h-4" />
        }
      };
      
      const mappedStatus = statusMap[equipment.status.toLowerCase()];
      if (mappedStatus) {
        return mappedStatus;
      }
    }

    // Fallback: usa lógica dos checklists se não houver status no banco
    const equipmentChecklists = checklistRecords
      .filter(record => record.equipmentCode === equipmentCode)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Se não tem checklist, está disponível
    if (equipmentChecklists.length === 0) {
      return {
        status: 'disponivel',
        label: 'Disponível',
        color: 'text-white',
        bgColor: 'bg-safety-green',
        icon: <CheckCircle className="w-4 h-4" />
      };
    }

    const lastChecklist = equipmentChecklists[0];

    // Se foi negado pelo mecânico, está em manutenção
    if (lastChecklist.status === 'negado') {
      return {
        status: 'manutencao',
        label: 'Em Manutenção',
        color: 'text-white',
        bgColor: 'bg-safety-red',
        icon: <Wrench className="w-4 h-4" />
      };
    }

    // Se foi aprovado, está operando
    if (lastChecklist.status === 'conforme') {
      return {
        status: 'operando',
        label: 'Operando',
        color: 'text-white',
        bgColor: 'bg-industrial-blue',
        icon: <Clock className="w-4 h-4" />
      };
    }

    // Se está pendente de aprovação, está disponível até decisão
    return {
      status: 'disponivel',
      label: 'Disponível',
      color: 'text-white',
      bgColor: 'bg-safety-green',
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStatus === 'all') return matchesSearch;
    
    const currentStatus = getEquipmentStatus(equipment.code);
    return matchesSearch && currentStatus.status === selectedStatus;
  });

  const handleEditStatus = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    const currentStatus = getEquipmentStatus(equipment.code);
    setNewStatus(currentStatus.status);
    setStatusReason('');
  };

  const handleViewEquipment = (equipment: Equipment) => {
    setViewingEquipment(equipment);
  };

  const handleSaveStatus = () => {
    if (editingEquipment && onUpdateEquipmentStatus) {
      onUpdateEquipmentStatus(editingEquipment.id, newStatus, statusReason);
      setEditingEquipment(null);
      setStatusReason('');
    }
  };

  const getStatusCount = (status: string) => {
    return equipments.filter(equipment => {
      const currentStatus = getEquipmentStatus(equipment.code);
      return currentStatus.status === status;
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Loading Spinner */}
      {isLoading && equipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-industrial-blue border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-safety-orange border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">Carregando equipamentos...</p>
        </div>
      )}

      {/* Content - Only show when not loading or has data */}
      {(!isLoading || equipments.length > 0) && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel de Status</h1>
          <p className="text-muted-foreground">
            {canEdit ? 'Visualize e gerencie o status dos equipamentos' : 'Visualize o status atual dos equipamentos'}
          </p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponível</p>
                <p className="text-2xl font-bold text-safety-green">{getStatusCount('disponivel')}</p>
              </div>
              <div className="w-12 h-12 bg-safety-green rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Operando</p>
                <p className="text-2xl font-bold text-industrial-blue">{getStatusCount('operando')}</p>
              </div>
              <div className="w-12 h-12 bg-industrial-blue rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold text-safety-red">{getStatusCount('manutencao')}</p>
              </div>
              <div className="w-12 h-12 bg-safety-red rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por código, modelo ou marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="operando">Operando</SelectItem>
                <SelectItem value="manutencao">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipments.map((equipment) => {
          const status = getEquipmentStatus(equipment.code);
          return (
            <Card key={equipment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Equipment Photo */}
                  {equipment.photo && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={equipment.photo}
                        alt={`${equipment.brand} ${equipment.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Equipment Info */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{equipment.code}</h3>
                        <p className="text-sm text-muted-foreground">
                          {equipment.brand} {equipment.model} ({equipment.year})
                        </p>
                        <p className="text-xs text-muted-foreground">Setor: {equipment.sector}</p>
                      </div>
                      <Badge className={cn(status.bgColor, status.color)}>
                        <div className="flex items-center gap-1">
                          {status.icon}
                          {status.label}
                        </div>
                      </Badge>
                    </div>
                  </div>

                  {/* Action Button */}
                  {canEdit ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStatus(equipment)}
                      className="w-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar Status
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEquipment(equipment)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEquipments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum equipamento encontrado.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Status Dialog */}
      <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Status do Equipamento</DialogTitle>
            <DialogDescription>
              Altere o status do equipamento {editingEquipment?.code}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="operando">Operando</SelectItem>
                  <SelectItem value="manutencao">Em Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Motivo da alteração</Label>
              <Textarea
                id="reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Descreva o motivo da alteração de status..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEquipment(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStatus}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Equipment Dialog */}
      <Dialog open={!!viewingEquipment} onOpenChange={() => setViewingEquipment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Equipamento</DialogTitle>
            <DialogDescription>
              Informações completas do equipamento {viewingEquipment?.code}
            </DialogDescription>
          </DialogHeader>
          
          {viewingEquipment && (
            <div className="space-y-6">
              {/* Equipment Photo */}
              {viewingEquipment.photo && (
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={viewingEquipment.photo}
                    alt={`${viewingEquipment.brand} ${viewingEquipment.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Equipment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Código</Label>
                  <p className="text-lg font-semibold">{viewingEquipment.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const status = getEquipmentStatus(viewingEquipment.code);
                      return (
                        <Badge className={cn(status.bgColor, status.color)}>
                          <div className="flex items-center gap-1">
                            {status.icon}
                            {status.label}
                          </div>
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Marca</Label>
                  <p className="text-base">{viewingEquipment.brand}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Modelo</Label>
                  <p className="text-base">{viewingEquipment.model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ano</Label>
                  <p className="text-base">{viewingEquipment.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Setor</Label>
                  <p className="text-base">{viewingEquipment.sector}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Último Check</Label>
                  <p className="text-base">{new Date(viewingEquipment.lastCheck).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Próxima Manutenção</Label>
                  <p className="text-base">{new Date(viewingEquipment.nextMaintenance).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Observações do Mecânico */}
              {viewingEquipment.observations && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações / Motivo da Alteração de Status</Label>
                  <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingEquipment.observations}</p>
                  </div>
                </div>
              )}

              {/* Recent Checklists */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Histórico Recente</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {checklistRecords
                    .filter(record => record.equipmentCode === viewingEquipment.code)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)
                    .map(record => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(record.timestamp).toLocaleDateString('pt-BR')} - {new Date(record.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.naoConformeItems > 0 ? `${record.naoConformeItems} não conformidades` : 'Todas conformidades OK'}
                          </p>
                        </div>
                        <Badge variant={
                          record.status === 'conforme' ? 'default' : 
                          record.status === 'pendente' ? 'secondary' : 
                          'destructive'
                        }>
                          {record.status === 'conforme' ? 'Aprovado' : 
                           record.status === 'pendente' ? 'Pendente' : 
                           'Reprovado'}
                        </Badge>
                      </div>
                    ))}
                  {checklistRecords.filter(record => record.equipmentCode === viewingEquipment.code).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum checklist registrado</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewingEquipment(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
};

export default StatusPanel;