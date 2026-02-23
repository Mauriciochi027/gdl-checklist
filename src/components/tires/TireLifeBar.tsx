import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TireLifeBarProps {
  initialDepth: number | null;
  currentDepth: number | null;
  compact?: boolean;
}

const getLifeColor = (percentage: number, currentDepth: number | null) => {
  // Critical: below 5mm always red
  if (currentDepth !== null && currentDepth < 5) {
    return { bar: 'bg-red-500', text: 'text-red-600', label: 'Crítico' };
  }
  if (percentage <= 20) {
    return { bar: 'bg-orange-500', text: 'text-orange-600', label: 'Baixa' };
  }
  if (percentage <= 50) {
    return { bar: 'bg-yellow-500', text: 'text-yellow-600', label: 'Atenção' };
  }
  if (percentage <= 75) {
    return { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Boa' };
  }
  return { bar: 'bg-green-500', text: 'text-green-600', label: 'Ótima' };
};

export const TireLifeBar = ({ initialDepth, currentDepth, compact = false }: TireLifeBarProps) => {
  if (!initialDepth || initialDepth <= 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Sem prof. inicial
      </span>
    );
  }

  const depth = currentDepth ?? initialDepth;
  const percentage = Math.max(0, Math.min(100, (depth / initialDepth) * 100));
  const life = getLifeColor(percentage, currentDepth);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={compact ? 'w-24' : 'w-full min-w-[120px]'}>
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[10px] font-semibold ${life.text}`}>
                {Math.round(percentage)}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {depth.toFixed(1)}mm
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden border border-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${life.bar}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">Vida Útil: {life.label}</p>
          <p>Prof. inicial: {initialDepth.toFixed(1)}mm</p>
          <p>Prof. atual: {depth.toFixed(1)}mm</p>
          <p>Desgaste: {(initialDepth - depth).toFixed(1)}mm</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
