import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Truck, Calendar, MapPin, AlertCircle, CheckCircle, Upload, X } from "lucide-react";

interface Equipment {
  id: string;
  code: string;
  model: string;
  brand: string;
  year: number;
  sector: string;
  status: 'active' | 'maintenance' | 'inactive';
  lastCheck: string;
  nextMaintenance: string;
  observations?: string;
  photo?: string;
}

interface EquipmentListProps {
  equipments: Equipment[];
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  onUpdateEquipment: (id: string, equipment: Partial<Equipment>) => void;
}

const EquipmentList = ({ equipments, onAddEquipment, onUpdateEquipment }: EquipmentListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    model: string;
    brand: string;
    year: number;
    sector: string;
    status: Equipment['status'];
    lastCheck: string;
    nextMaintenance: string;
    observations: string;
    photo: string;
  }>({
    code: "",
    model: "",
    brand: "",
    year: new Date().getFullYear(),
    sector: "",
    status: "active",
    lastCheck: "",
    nextMaintenance: "",
    observations: "",
    photo: ""
  });

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || equipment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEquipment) {
      onUpdateEquipment(editingEquipment.id, formData);
    } else {
      onAddEquipment(formData);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      model: "",
      brand: "",
      year: new Date().getFullYear(),
      sector: "",
      status: "active",
      lastCheck: "",
      nextMaintenance: "",
      observations: "",
      photo: ""
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
      status: equipment.status,
      lastCheck: equipment.lastCheck,
      nextMaintenance: equipment.nextMaintenance,
      observations: equipment.observations || "",
      photo: equipment.photo || ""
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-safety-green text-white">Ativo</Badge>;
      case 'maintenance':
        return <Badge className="bg-safety-orange text-white">Manutenção</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipamentos</h2>
          <p className="text-gray-600">Cadastro e controle de empilhadeiras</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-industrial-blue hover:bg-industrial-blue-dark" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código/Número *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="EMP-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Toyota, Hyster, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="7FBR15"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <Label htmlFor="sector">Setor</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({...formData, sector: e.target.value})}
                    placeholder="Armazém, Expedição, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastCheck">Último Checklist</Label>
                  <Input
                    id="lastCheck"
                    type="date"
                    value={formData.lastCheck}
                    onChange={(e) => setFormData({...formData, lastCheck: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nextMaintenance">Próxima Manutenção</Label>
                  <Input
                    id="nextMaintenance"
                    type="date"
                    value={formData.nextMaintenance}
                    onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="photo">Foto do Equipamento</Label>
                <div className="space-y-3">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const result = e.target?.result as string;
                          setFormData({...formData, photo: result});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {formData.photo && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img 
                        src={formData.photo} 
                        alt="Preview do equipamento" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => setFormData({...formData, photo: ""})}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  placeholder="Informações adicionais sobre o equipamento..."
                  rows={3}
                />
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
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por código, modelo ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipments.map((equipment) => (
          <Card key={equipment.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(equipment)}>
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
              {equipment.photo && (
                <div className="flex justify-center">
                  <img 
                    src={equipment.photo} 
                    alt={`Equipamento ${equipment.code}`}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                </div>
              )}
              
              <div>
                <p className="font-medium text-gray-900">{equipment.brand} {equipment.model}</p>
                <p className="text-sm text-gray-600">Ano: {equipment.year}</p>
              </div>
              
              {equipment.sector && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {equipment.sector}
                </div>
              )}
              
              {equipment.lastCheck && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Último check: {new Date(equipment.lastCheck).toLocaleDateString('pt-BR')}
                </div>
              )}

              {equipment.nextMaintenance && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-safety-orange" />
                  <span>Manutenção: {new Date(equipment.nextMaintenance).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipments.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum equipamento encontrado</p>
        </div>
      )}
    </div>
  );
};

export default EquipmentList;