// Unified Equipment interface for the entire system
export interface Equipment {
  id: string;
  code: string;
  brand: string;
  model: string;
  year: number;
  sector: string;
  status: 'active' | 'maintenance' | 'inactive' | 'operando' | 'disponivel';
  // Legacy properties for existing components
  lastCheck: string;
  nextMaintenance: string;
  observations?: string;
  photo?: string;
  // QR Code specific fields
  operatorName?: string;
  operatorId?: string;
  location?: string;
  unit?: string;
  equipmentSeries?: string;
  equipmentNumber?: string;
  hourMeter?: string;
  // Operation tracking
  lastChecklistId?: string;
  lastOperationStart?: string;
  currentIssues?: Array<{
    description: string;
    photo: string;
    timestamp: string;
  }>;
}

export interface ChecklistAnswer {
  itemId: string;
  value: 'sim' | 'nao' | 'nao_aplica';
  observation?: string;
}

export interface ChecklistRecord {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentModel: string;
  operatorName: string;
  operatorId: string;
  timestamp: string;
  status: 'conforme' | 'pendente' | 'negado';
  totalItems: number;
  conformeItems: number;
  naoConformeItems: number;
  answers: ChecklistAnswer[];
  signature: string;
  photos: Record<string, string[]>;
  hasCriticalIssues: boolean;
  approvals?: Array<{ mechanicName: string; timestamp: string; comment: string; }>;
  rejections?: Array<{ mechanicName: string; timestamp: string; reason: string; }>;
  // Equipment specific data from QR code
  equipmentModel_type?: string;
  location?: string;
  unit?: string;
  equipmentSeries?: string;
  equipmentNumber?: string;
  hourMeter?: number;
}

export type EquipmentStatus = Equipment['status'];