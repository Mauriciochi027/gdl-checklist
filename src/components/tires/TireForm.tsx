import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tire, TireFormData } from '@/hooks/useTires';
import { supabase } from '@/integrations/supabase/client';

interface Equipment {
  id: string;
  code: string;
  model: string;
}

interface TireFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TireFormData) => Promise<boolean>;
  tire?: Tire | null;
}

const POSITIONS = [
  { value: 'DD-E', label: 'Dianteira Direita Externo (DD-E)' },
  { value: 'DD-I', label: 'Dianteira Direita Interno (DD-I)' },
  { value: 'DE-E', label: 'Dianteira Esquerda Externo (DE-E)' },
  { value: 'DE-I', label: 'Dianteira Esquerda Interna (DE-I)' },
  { value: 'TD', label: 'Traseira Direita (TD)' },
  { value: 'TE', label: 'Traseira Esquerda (TE)' },
];

export const TireForm = ({ open, onOpenChange, onSubmit, tire }: TireFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState<TireFormData>({
    code: '',
    model: '',
    status: 'estoque',
    equipment_id: '',
    position: '',
    initial_depth: undefined,
    initial_hour_meter: undefined,
  });

  // Carregar equipamentos
  useEffect(() => {
    const fetchEquipments = async () => {
      const { data } = await supabase
        .from('equipment')
        .select('id, code, model')
        .order('code');
      setEquipments(data || []);
    };
    fetchEquipments();
  }, []);

  // Preencher formulário ao editar
  useEffect(() => {
    if (tire) {
      setFormData({
        code: tire.code,
        model: tire.model || '',
        status: tire.status,
        equipment_id: tire.equipment_id || '',
        position: tire.position || '',
        initial_depth: tire.initial_depth || undefined,
        initial_hour_meter: tire.initial_hour_meter || undefined,
      });
    } else {
      setFormData({
        code: '',
        model: '',
        status: 'estoque',
        equipment_id: '',
        position: '',
        initial_depth: undefined,
        initial_hour_meter: undefined,
      });
    }
  }, [tire, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onSubmit(formData);
    
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const showEquipmentFields = formData.status === 'em_uso';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tire ? 'Editar Pneu' : 'Cadastrar Novo Pneu'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código do Pneu *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ex: PN-001"
              required
              disabled={!!tire}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Tipo / Modelo</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: 700-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'estoque' | 'em_uso' | 'em_reforma') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estoque">Em Estoque</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="em_reforma">Em Reforma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showEquipmentFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipamento</Label>
                <Select
                  value={formData.equipment_id}
                  onValueChange={(value) => setFormData({ ...formData, equipment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.code} - {eq.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Posição no Equipamento</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a posição" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="initial_depth">Profundidade Inicial (mm)</Label>
                  <Input
                    id="initial_depth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.initial_depth || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      initial_depth: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="Ex: 25.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_hour_meter">Horímetro Inicial</Label>
                  <Input
                    id="initial_hour_meter"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.initial_hour_meter || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      initial_hour_meter: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="Ex: 1500.5"
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (tire ? 'Salvar' : 'Cadastrar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
