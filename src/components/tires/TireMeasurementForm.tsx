import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MeasurementFormData } from '@/hooks/useTires';
import { format } from 'date-fns';

interface TireMeasurementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MeasurementFormData) => Promise<boolean>;
  tireId: string;
  tireCode: string;
  measuredBy?: string;
}

export const TireMeasurementForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  tireId, 
  tireCode,
  measuredBy 
}: TireMeasurementFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    depth: '',
    measured_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onSubmit({
      tire_id: tireId,
      depth: parseFloat(formData.depth),
      measured_at: new Date(formData.measured_at).toISOString(),
      notes: formData.notes || undefined,
      measured_by: measuredBy,
    });
    
    setIsSubmitting(false);
    if (success) {
      setFormData({
        depth: '',
        measured_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: '',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Medição - {tireCode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depth">Profundidade (mm) *</Label>
            <Input
              id="depth"
              type="number"
              step="0.1"
              min="0"
              value={formData.depth}
              onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
              placeholder="Ex: 20.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="measured_at">Data/Hora da Medição *</Label>
            <Input
              id="measured_at"
              type="datetime-local"
              value={formData.measured_at}
              onChange={(e) => setFormData({ ...formData, measured_at: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a medição..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.depth}>
              {isSubmitting ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
