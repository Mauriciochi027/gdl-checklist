import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Truck, Calendar, MapPin, AlertCircle, CheckCircle, Upload, X, QrCode, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EquipmentQRCode from "./EquipmentQRCode";
import { Equipment } from "@/types/equipment";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface EquipmentListProps {
  equipments: Equipment[];
  isLoading: boolean;
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  onUpdateEquipment: (id: string, equipment: Partial<Equipment>) => void;
}
const EquipmentList = ({
  equipments,
  isLoading,
  onAddEquipment,
  onUpdateEquipment
}: EquipmentListProps) => {
  const { user } = useAuth();
  const { canEdit, canDelete } = usePermissions(user);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrEquipment, setQrEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  // Verificar permissões usando o novo sistema
  const canManageEquipment = canEdit('equipments');
  const canDeleteEquipment = canDelete('equipments');
  const [formData, setFormData] = useState<{
    code: string;
    model: string;
    brand: string;
    year: number;
    sector: string;
    costCenter: string;
    status: Equipment['status'];
    lastCheck: string;
    nextMaintenance: string;
    observations: string;
    photo: string;
    operatorName: string;
    operatorId: string;
    location: string;
    unit: string;
    equipmentSeries: string;
    equipmentNumber: string;
    hourMeter: string;
  }>({
    code: "",
    model: "",
    brand: "",
    year: new Date().getFullYear(),
    sector: "",
    costCenter: "",
    status: "active",
    lastCheck: "",
    nextMaintenance: "",
    observations: "",
    photo: "",
    operatorName: "Carlos Oliveira",
    operatorId: "MEC001",
    location: "",
    unit: "GDL LOGISTICA INTEGRADA",
    equipmentSeries: "",
    equipmentNumber: "",
    hourMeter: "0"
  });
  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) || equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) || equipment.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || equipment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let equipmentWithId: Equipment;
    if (editingEquipment) {
      onUpdateEquipment(editingEquipment.id, formData);
      equipmentWithId = {
        ...editingEquipment,
        ...formData
      };
    } else {
      const newEquipment = {
        ...formData
      };
      onAddEquipment(newEquipment);
      equipmentWithId = {
        id: Date.now().toString(),
        ...formData
      } as Equipment;
    }
    resetForm();
    setIsDialogOpen(false);

    // Mostrar QR Code após cadastro/edição
    setQrEquipment(equipmentWithId);
    setShowQRCode(true);
  };
  const resetForm = () => {
    setFormData({
      code: "",
      model: "",
      brand: "",
      year: new Date().getFullYear(),
      sector: "",
      costCenter: "",
      status: "active",
      lastCheck: "",
      nextMaintenance: "",
      observations: "",
      photo: "",
      operatorName: "Carlos Oliveira",
      operatorId: "MEC001",
      location: "",
      unit: "GDL LOGISTICA INTEGRADA",
      equipmentSeries: "",
      equipmentNumber: "",
      hourMeter: "0"
    });
    setEditingEquipment(null);
  };
  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      code: equipment.code,
      model: equipment.model,
      brand: equipment.brand,
      year: equipment.year,
      sector: equipment.sector,
      costCenter: equipment.costCenter || "",
      status: equipment.status,
      lastCheck: equipment.lastCheck,
      nextMaintenance: equipment.nextMaintenance,
      observations: equipment.observations || "",
      photo: equipment.photo || "",
      operatorName: equipment.operatorName || "Carlos Oliveira",
      operatorId: equipment.operatorId || "MEC001",
      location: equipment.location || "",
      unit: equipment.unit || "Principal",
      equipmentSeries: equipment.equipmentSeries || "",
      equipmentNumber: equipment.equipmentNumber || "",
      hourMeter: equipment.hourMeter || "0"
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!equipmentToDelete) return;

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipmentToDelete.id);

      if (error) throw error;

      toast({
        title: "Equipamento deletado",
        description: `O equipamento ${equipmentToDelete.code} foi removido com sucesso.`,
      });

      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar equipamento:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o equipamento. Verifique se você tem permissão.",
        variant: "destructive",
      });
    }
  };
  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-safety-green text-white">Ativo</Badge>;
      case 'operando':
        return <Badge className="bg-industrial-blue text-white">Em Operação</Badge>;
      case 'disponivel':
        return <Badge className="bg-safety-green text-white">Disponível</Badge>;
      case 'maintenance':
        return <Badge className="bg-safety-orange text-white">Manutenção</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  return <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Equipamentos</h2>
          <p className="text-xs sm:text-sm text-gray-600">Cadastro e controle</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="default"
              className="border-4 border-primary shadow-lg hover:shadow-xl font-bold text-sm h-9 sm:h-10" 
              onClick={resetForm}
              disabled={!canManageEquipment}
              title={!canManageEquipment ? "Você não tem permissão para adicionar equipamentos" : undefined}
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo Equipamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
                </DialogTitle>
                <DialogDescription>
                  {editingEquipment ? 'Atualize as informações do equipamento' : 'Preencha os dados do novo equipamento'}
                </DialogDescription>
              </DialogHeader>
            
              <ScrollArea className="h-full max-h-[60vh] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Código/Número *</Label>
                      <Input id="code" value={formData.code} onChange={e => setFormData({
                    ...formData,
                    code: e.target.value
                  })} placeholder="EMP-001" required />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: Equipment['status']) => setFormData({
                    ...formData,
                    status: value
                  })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="operando">Em Operação</SelectItem>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="maintenance">Manutenção</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Marca *</Label>
                      <Input id="brand" value={formData.brand} onChange={e => setFormData({
                    ...formData,
                    brand: e.target.value
                  })} placeholder="Toyota, Hyster, etc." required />
                    </div>
                    <div>
                      <Label htmlFor="model">Modelo *</Label>
                      <Input id="model" value={formData.model} onChange={e => setFormData({
                    ...formData,
                    model: e.target.value
                  })} placeholder="7FBR15" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">Ano</Label>
                      <Input id="year" type="number" value={formData.year} onChange={e => setFormData({
                    ...formData,
                    year: parseInt(e.target.value)
                  })} min="1990" max={new Date().getFullYear() + 1} />
                    </div>
                    <div>
                      <Label htmlFor="sector">Setor</Label>
                      <Input id="sector" value={formData.sector} onChange={e => setFormData({
                    ...formData,
                    sector: e.target.value
                  })} placeholder="Armazém, Expedição, etc." />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="costCenter">Centro de Custo</Label>
                      <Input id="costCenter" value={formData.costCenter} onChange={e => setFormData({
                    ...formData,
                    costCenter: e.target.value
                  })} placeholder="Digite o centro de custo" />
                    </div>
                    <div>
                      <Label htmlFor="lastCheck">Último Checklist realizado</Label>
                      <Input id="lastCheck" type="date" value={formData.lastCheck} onChange={e => setFormData({
                    ...formData,
                    lastCheck: e.target.value
                  })} />
                    </div>
                  </div>

                  {/* Seção de Informações para QR Code */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Informações Básicas (QR Code)
                    </h3>
                    
                    

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Local *</Label>
                        <Input id="location" value={formData.location} onChange={e => setFormData({
                      ...formData,
                      location: e.target.value
                    })} placeholder="Digite o local" required />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unidade de Negócio *</Label>
                        <Select value={formData.unit} onValueChange={value => setFormData({
                      ...formData,
                      unit: value
                    })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GDL LOGISTICA INTEGRADA">GDL LOGISTICA INTEGRADA</SelectItem>
                            <SelectItem value="GDL TRANSPORTE E ARMAZÉNS GERAIS">GDL TRANSPORTE E ARMAZÉNS GERAIS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="equipmentSeries">Série do Equipamento</Label>
                        <Input id="equipmentSeries" value={formData.equipmentSeries} onChange={e => setFormData({
                      ...formData,
                      equipmentSeries: e.target.value
                    })} placeholder="Série do equipamento" />
                      </div>
                      <div>
                        <Label htmlFor="equipmentNumber">Número do Equipamento</Label>
                        <Input id="equipmentNumber" value={formData.equipmentNumber} onChange={e => setFormData({
                      ...formData,
                      equipmentNumber: e.target.value
                    })} placeholder="Número do equipamento" />
                      </div>
                      <div>
                        <Label htmlFor="hourMeter">Horímetro</Label>
                        <Input id="hourMeter" value={formData.hourMeter} onChange={e => setFormData({
                      ...formData,
                      hourMeter: e.target.value
                    })} placeholder="Digite o horímetro" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="photo">Foto do Equipamento</Label>
                    <div className="space-y-3">
                      <Input id="photo" type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = e => {
                        const result = e.target?.result as string;
                        setFormData({
                          ...formData,
                          photo: result
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="cursor-pointer" />
                      {formData.photo && <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <img src={formData.photo} alt="Preview do equipamento" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => setFormData({
                      ...formData,
                      photo: ""
                    })}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>}
                    </div>
                  </div>

                  

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-industrial-blue hover:bg-industrial-blue-dark">
                      {editingEquipment ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
        </Dialog>
      </div>

      {/* Filters - Otimizado para Mobile */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar por código, modelo ou marca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="operando">Em Operação</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-industrial-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando equipamentos...</p>
        </div>
      )}

      {/* Equipment Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipments.map(equipment => <Card key={equipment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-industrial-blue" />
                    {equipment.code}
                  </CardTitle>
                  {getStatusBadge(equipment.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipment.photo && <div className="flex justify-center">
                    <img src={equipment.photo} alt={`Equipamento ${equipment.code}`} className="w-24 h-24 object-cover rounded-lg border" />
                  </div>}
                
                <div>
                  <p className="font-medium text-gray-900">{equipment.brand} {equipment.model}</p>
                  <p className="text-sm text-gray-600">Ano: {equipment.year}</p>
                </div>
                
                {equipment.sector && <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {equipment.sector}
                  </div>}
                
                {equipment.lastCheck && <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Último check: {new Date(equipment.lastCheck).toLocaleDateString('pt-BR')}
                  </div>}

                {equipment.nextMaintenance && <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-safety-orange" />
                    <span>Manutenção: {new Date(equipment.nextMaintenance).toLocaleDateString('pt-BR')}</span>
                  </div>}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={e => {
                e.stopPropagation();
                setQrEquipment(equipment);
                setShowQRCode(true);
              }} className="flex-1">
                    <QrCode className="w-4 h-4 mr-1" />
                    QR Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={e => {
                e.stopPropagation();
                handleEdit(equipment);
              }} className="flex-1" disabled={!canManageEquipment}>
                    Editar
                  </Button>
                  {canDeleteEquipment && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteClick(equipment);
                      }} 
                      className="text-safety-red hover:text-safety-red hover:bg-safety-red/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>)}
        </div>
      )}

      {!isLoading && filteredEquipments.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum equipamento encontrado</p>
        </div>
      )}

      {/* Dialog do QR Code */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              QR Code Gerado com Sucesso!
            </DialogTitle>
          </DialogHeader>
          {qrEquipment && <div className="flex justify-center">
              <EquipmentQRCode equipment={qrEquipment} />
            </div>}
          <div className="flex justify-end">
            <Button onClick={() => setShowQRCode(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o equipamento <strong>{equipmentToDelete?.code}</strong>?
              Esta ação não pode ser desfeita e irá remover todos os dados relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-safety-red hover:bg-safety-red/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default EquipmentList;