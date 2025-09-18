import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Play, Square, AlertTriangle, CheckCircle, Camera } from 'lucide-react';

interface Equipment {
  id: string;
  code: string;
  brand: string;
  model: string;
  sector: string;
  status: 'active' | 'maintenance' | 'inactive' | 'operando' | 'disponivel';
}

interface OperationControlProps {
  equipment: Equipment;
  isChecklistCompleted: boolean;
  hasNonConformities: boolean;
  onStartOperation: (equipmentId: string) => void;
  onEndOperation: (equipmentId: string, hasIssue: boolean, issue?: { description: string; photo: string }) => void;
  canStartNewChecklist: boolean;
}

export const OperationControl = ({ 
  equipment, 
  isChecklistCompleted, 
  hasNonConformities,
  onStartOperation, 
  onEndOperation,
  canStartNewChecklist 
}: OperationControlProps) => {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [hasIssue, setHasIssue] = useState<boolean | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePhoto, setIssuePhoto] = useState('');

  // Lógica para iniciar operação
  const handleStartOperation = () => {
    onStartOperation(equipment.id);
    toast({
      title: "Operação iniciada",
      description: `Equipamento ${equipment.code} está agora em operação.`,
    });
  };

  // Upload de foto para problemas
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setIssuePhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Finalizar operação com ou sem problemas
  const handleEndOperation = () => {
    if (hasIssue && (!issueDescription.trim() || !issuePhoto)) {
      toast({
        title: "Campos obrigatórios",
        description: "Descrição e foto são obrigatórios quando há problemas.",
        variant: "destructive",
      });
      return;
    }

    const issue = hasIssue ? { description: issueDescription, photo: issuePhoto } : undefined;
    onEndOperation(equipment.id, hasIssue || false, issue);

    // Reset form
    setShowEndDialog(false);
    setHasIssue(null);
    setIssueDescription('');
    setIssuePhoto('');

    toast({
      title: "Operação finalizada",
      description: hasIssue 
        ? `Equipamento ${equipment.code} enviado para manutenção.`
        : `Equipamento ${equipment.code} está disponível para uso.`,
    });
  };

  // Badges de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operando':
        return <Badge variant="default" className="bg-blue-500">Em Operação</Badge>;
      case 'disponivel':
        return <Badge variant="secondary">Disponível</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Manutenção</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Tela verde "Apto para Uso" após checklist aprovado
  if (isChecklistCompleted && !hasNonConformities && equipment.status !== 'operando') {
    return (
      <Card className="border-green-500 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="text-green-700 flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Equipamento Apto para Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-green-600">
            O checklist foi aprovado e o equipamento está liberado para operação.
          </p>
          <Button 
            onClick={handleStartOperation}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Operação
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Controles durante operação
  if (equipment.status === 'operando') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Equipamento em Operação</span>
            {getStatusBadge(equipment.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Equipamento {equipment.code} ({equipment.brand} {equipment.model}) está sendo operado.
          </p>

          <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Square className="w-4 h-4 mr-2" />
                Término de Trabalho
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar Operação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Houve alguma avaria ou problema durante a operação?</p>

                <div className="flex gap-2">
                  <Button
                    variant={hasIssue === false ? "default" : "outline"}
                    onClick={() => setHasIssue(false)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Não houve problemas
                  </Button>
                  <Button
                    variant={hasIssue === true ? "destructive" : "outline"}
                    onClick={() => setHasIssue(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Sim, houve problemas
                  </Button>
                </div>

                {hasIssue === true && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="issue-description">Descrição do Problema *</Label>
                      <Textarea
                        id="issue-description"
                        value={issueDescription}
                        onChange={(e) => setIssueDescription(e.target.value)}
                        placeholder="Descreva detalhadamente o problema encontrado..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issue-photo">Foto do Problema *</Label>
                      <div className="space-y-2">
                        <input
                          id="issue-photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('issue-photo')?.click()}
                          className="w-full"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {issuePhoto ? 'Trocar Foto' : 'Adicionar Foto'}
                        </Button>
                        {issuePhoto && (
                          <img 
                            src={issuePhoto} 
                            alt="Problema relatado" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasIssue !== null && (
                  <Button 
                    onClick={handleEndOperation}
                    className="w-full"
                    variant={hasIssue ? "destructive" : "default"}
                  >
                    {hasIssue ? 'Finalizar e Enviar para Manutenção' : 'Finalizar Operação'}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Status padrão
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status do Equipamento</span>
          {getStatusBadge(equipment.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {equipment.code} ({equipment.brand} {equipment.model})
        </p>
        {!canStartNewChecklist && (
          <p className="text-amber-600 mt-2 text-sm">
            ⚠️ Finalize a operação atual antes de realizar um novo checklist.
          </p>
        )}
      </CardContent>
    </Card>
  );
};