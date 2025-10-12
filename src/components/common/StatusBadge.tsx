import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

type ChecklistStatus = 'conforme' | 'pendente' | 'negado';
type EquipmentStatus = 'disponivel' | 'operando' | 'manutencao';
type AnswerValue = 'sim' | 'nao' | 'nao_aplica';

interface StatusBadgeProps {
  status: ChecklistStatus | EquipmentStatus | AnswerValue;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente reutilizável para badges de status
 */
export const StatusBadge = ({ status, showIcon = false, size = 'md' }: StatusBadgeProps) => {
  const getChecklistStatusConfig = (status: string) => {
    switch (status) {
      case 'conforme':
        return {
          label: 'Aprovado',
          className: 'bg-safety-green text-white',
          icon: CheckCircle
        };
      case 'pendente':
        return {
          label: 'Pendente',
          className: 'bg-safety-orange text-white',
          icon: Clock
        };
      case 'negado':
        return {
          label: 'Negado',
          className: 'bg-safety-red text-white',
          icon: XCircle
        };
      default:
        return {
          label: status,
          className: 'bg-gray-500 text-white',
          icon: Clock
        };
    }
  };

  const getEquipmentStatusConfig = (status: string) => {
    switch (status) {
      case 'disponivel':
        return {
          label: 'Disponível',
          className: 'bg-safety-green text-white',
          icon: CheckCircle
        };
      case 'operando':
        return {
          label: 'Operando',
          className: 'bg-industrial-blue text-white',
          icon: CheckCircle
        };
      case 'manutencao':
        return {
          label: 'Manutenção',
          className: 'bg-safety-orange text-white',
          icon: Clock
        };
      default:
        return {
          label: status,
          className: 'bg-gray-500 text-white',
          icon: Clock
        };
    }
  };

  const getAnswerConfig = (value: string) => {
    switch (value) {
      case 'sim':
        return {
          label: 'OK',
          className: 'bg-safety-green text-white',
          icon: CheckCircle
        };
      case 'nao':
        return {
          label: 'NOK',
          className: 'bg-safety-red text-white',
          icon: XCircle
        };
      case 'nao_aplica':
        return {
          label: 'N/A',
          className: 'bg-gray-500 text-white',
          icon: Clock
        };
      default:
        return {
          label: value,
          className: 'bg-gray-500 text-white',
          icon: Clock
        };
    }
  };

  // Determina qual configuração usar baseado no tipo de status
  let config;
  if (['conforme', 'pendente', 'negado'].includes(status)) {
    config = getChecklistStatusConfig(status);
  } else if (['disponivel', 'operando', 'manutencao'].includes(status)) {
    config = getEquipmentStatusConfig(status);
  } else {
    config = getAnswerConfig(status);
  }

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]}`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
