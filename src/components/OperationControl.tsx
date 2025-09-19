import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Play, Square, AlertTriangle, CheckCircle, Camera } from 'lucide-react';
import { Equipment } from '@/types/equipment';

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
        return <Badge className="bg-industrial-blue text-white">Em Operação</Badge>;
      case 'disponivel':
        return <Badge className="bg-safety-green text-white">Disponível</Badge>;
      case 'maintenance':
        return <Badge className="bg-safety-red text-white">Manutenção</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Tela verde "Apto para Uso" após checklist aprovado
  if (isChecklistCompleted && !hasNonConformities && equipment.status !== 'operando') {
    return (
      <Card className="border-safety-green bg-safety-green-light">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-safety-green">
            <CheckCircle className="w-6 h-6" />
            Equipamento Apto para Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-safety-green">
            O checklist foi aprovado e o equipamento está liberado para operação.
          </p>
          <Button 
            onClick={handleStartOperation}
            className="bg-safety-green hover:bg-safety-green text-white w-full"
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
      <Card className="border-industrial-blue bg-industrial-blue-light">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Equipamento em Operação</span>
            {getStatusBadge(equipment.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-industrial-blue">
            Equipamento {equipment.code} ({equipment.brand} {equipment.model}) está sendo operado.
          </p>
          
          <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-industrial-blue text-industrial-blue hover:bg-industrial-blue hover:text-white">
                <Square className="w-4 h-4 mr-2" />
                Término de Trabalho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Finalizar Operação</DialogTitle>
                <DialogDescription>
                  Finalize a operação do equipamento {equipment.code}. Informe se houve algum problema durante o uso.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Houve alguma avaria ou problema durante a operação?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={hasIssue === false ? "default" : "outline"}
                      onClick={() => setHasIssue(false)}
                      className="justify-start"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Não houve problemas
                    </Button>
                    <Button
                      variant={hasIssue === true ? "destructive" : "outline"}
                      onClick={() => setHasIssue(true)}
                      className="justify-start"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Sim, houve problemas
                    </Button>
                  </div>
                </div>

                {hasIssue === true && (
                  <div className="space-y-4 p-4 border border-safety-red-light bg-safety-red-light rounded-lg">
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
          <p className="text-warning mt-2 text-sm">
            ⚠️ Finalize a operação atual antes de realizar um novo checklist.
          </p>
        )}
      </CardContent>
    </Card>
  );
};