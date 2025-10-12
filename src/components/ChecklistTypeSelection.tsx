import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Forklift, Package } from "lucide-react";
import { ChecklistType, checklistTypeLabels, checklistTypeIcons } from "@/lib/liftingAccessoryChecklists";

interface ChecklistTypeSelectionProps {
  onSelectType: (type: ChecklistType) => void;
  onBack?: () => void;
}

export const ChecklistTypeSelection = ({ onSelectType, onBack }: ChecklistTypeSelectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-industrial-50 to-safety-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        )}
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-industrial-900">Sistema de Checklist</h1>
          <p className="text-industrial-600">Selecione o tipo de checklist que deseja realizar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Checklist de Equipamentos Móveis */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={() => onSelectType('empilhadeira')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Forklift className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-industrial-900">
                {checklistTypeLabels.empilhadeira}
              </h2>
              <p className="text-sm text-industrial-600">
                Inspeção pré-uso de empilhadeiras e equipamentos móveis
              </p>
            </CardContent>
          </Card>

          {/* Checklist de Acessórios de Içamento */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-secondary"
            onClick={() => {
              // Próxima tela mostrará os subtipos
              onSelectType('cinta_icamento'); // Temporário, será modificado
            }}
          >
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="text-xl font-bold text-industrial-900">
                Acessórios de Içamento de Carga
              </h2>
              <p className="text-sm text-industrial-600">
                Inspeção de cintas, manilhas, ganchos e correntes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const LiftingAccessorySelection = ({ onSelectType, onBack }: ChecklistTypeSelectionProps) => {
  const liftingTypes: ChecklistType[] = ['cinta_icamento', 'manilha', 'gancho', 'corrente_icamento'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-industrial-50 to-safety-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-industrial-900">Acessórios de Içamento</h1>
          <p className="text-industrial-600">Selecione o tipo de acessório para inspeção</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {liftingTypes.map((type) => (
            <Card 
              key={type}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => onSelectType(type)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="text-5xl">
                  {checklistTypeIcons[type]}
                </div>
                <h2 className="text-lg font-bold text-industrial-900">
                  {checklistTypeLabels[type]}
                </h2>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
