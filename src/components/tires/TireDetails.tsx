import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Ruler, Calendar, Truck, MapPin, Info } from 'lucide-react';
import { Tire, useTireMeasurements } from '@/hooks/useTires';
import { TireMeasurementForm } from './TireMeasurementForm';
import { TirePositionDiagram } from './TirePositionDiagram';
import { useAuth } from '@/hooks/useSupabaseAuth';

interface TireDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tire: Tire | null;
  isAdmin: boolean;
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    estoque: { label: 'Em Estoque', variant: 'secondary' },
    em_uso: { label: 'Em Uso', variant: 'default' },
    em_reforma: { label: 'Em Reforma', variant: 'outline' },
  };
  return badges[status] || { label: status, variant: 'outline' };
};

const getPositionLabel = (position: string) => {
  const labels: Record<string, string> = {
    'DD-E': 'Dianteira Direita Externo',
    'DD-I': 'Dianteira Direita Interno',
    'DE-E': 'Dianteira Esquerda Externo',
    'DE-I': 'Dianteira Esquerda Interna',
    'TD': 'Traseira Direita',
    'TE': 'Traseira Esquerda',
  };
  return labels[position] || position;
};

export const TireDetails = ({ open, onOpenChange, tire, isAdmin }: TireDetailsProps) => {
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const { user } = useAuth();
  const { measurements, isLoading, addMeasurement, deleteMeasurement } = useTireMeasurements(tire?.id || '');

  if (!tire) return null;

  const statusBadge = getStatusBadge(tire.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>Pneu: {tire.code}</span>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Código:</span>
                  <p className="font-medium">{tire.code}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modelo:</span>
                  <p className="font-medium">{tire.model || '-'}</p>
                </div>
                {tire.created_at && (
                  <div>
                    <span className="text-muted-foreground">Cadastrado em:</span>
                    <p className="font-medium">
                      {format(new Date(tire.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vinculação ao Equipamento */}
            {tire.status === 'em_uso' && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Equipamento Vinculado
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowDiagram(true)}
                    >
                      <Info className="w-4 h-4 mr-1" />
                      Ver Diagrama
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Equipamento:
                    </span>
                    <p className="font-medium">
                      {tire.equipment ? `${tire.equipment.code} - ${tire.equipment.model}` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Posição:
                    </span>
                    <p className="font-medium">
                      {tire.position ? `${tire.position} (${getPositionLabel(tire.position)})` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Profundidade Inicial:
                    </span>
                    <p className="font-medium">{tire.initial_depth ? `${tire.initial_depth} mm` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Horímetro Inicial:
                    </span>
                    <p className="font-medium">{tire.initial_hour_meter || '-'}</p>
                  </div>
                  {tire.mounted_at && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Montado em:</span>
                      <p className="font-medium">
                        {format(new Date(tire.mounted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Histórico de Medições */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Histórico de Desgaste
                  </CardTitle>
                  {isAdmin && (
                    <Button size="sm" onClick={() => setShowMeasurementForm(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Nova Medição
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-4">Carregando...</p>
                ) : measurements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma medição registrada.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Profundidade</TableHead>
                          <TableHead>Medido por</TableHead>
                          <TableHead>Observações</TableHead>
                          {isAdmin && <TableHead className="w-10"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {measurements.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              {format(new Date(m.measured_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">{m.depth} mm</TableCell>
                            <TableCell>{m.measured_by || '-'}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{m.notes || '-'}</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => deleteMeasurement(m.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <TireMeasurementForm
        open={showMeasurementForm}
        onOpenChange={setShowMeasurementForm}
        onSubmit={addMeasurement}
        tireId={tire.id}
        tireCode={tire.code}
        measuredBy={user?.name}
      />

      <TirePositionDiagram
        open={showDiagram}
        onOpenChange={setShowDiagram}
      />
    </>
  );
};
