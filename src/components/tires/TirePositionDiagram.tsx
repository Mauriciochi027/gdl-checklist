import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import tirePositionDiagram from '@/assets/tire-position-diagram.png';

interface TirePositionDiagramProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TirePositionDiagram = ({ open, onOpenChange }: TirePositionDiagramProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Diagrama de Posições dos Pneus</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center">
          <img 
            src={tirePositionDiagram} 
            alt="Diagrama de posições dos pneus" 
            className="max-w-full h-auto"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">DD-E</span>
            <span className="text-muted-foreground">Dianteira Direita Externo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">DD-I</span>
            <span className="text-muted-foreground">Dianteira Direita Interno</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">DE-E</span>
            <span className="text-muted-foreground">Dianteira Esquerda Externo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">DE-I</span>
            <span className="text-muted-foreground">Dianteira Esquerda Interna</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">TD</span>
            <span className="text-muted-foreground">Traseira Direita</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">TE</span>
            <span className="text-muted-foreground">Traseira Esquerda</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
