export interface LiftingChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
}

export type ChecklistType = 'empilhadeira' | 'cinta_icamento' | 'manilha' | 'gancho' | 'corrente_icamento';

export const liftingAccessoryChecklists: Record<ChecklistType, LiftingChecklistItem[]> = {
  empilhadeira: [], // Mantém vazio, usa checklistItems.ts
  
  cinta_icamento: [
    { id: "c1", category: "Identificação", description: "Etiqueta de identificação legível (capacidade, comprimento, fabricante, norma, fator de segurança)", required: true },
    { id: "c2", category: "Integridade", description: "Ausência de cortes, rasgos ou fios soltos", required: true },
    { id: "c3", category: "Desgaste", description: "Ausência de abrasão excessiva, desgaste, deformações ou desfiamentos", required: true },
    { id: "c4", category: "Contaminação", description: "Ausência de contaminação por óleo, graxa, produtos químicos ou queimaduras", required: true },
    { id: "c5", category: "Costura", description: "Costuras íntegras e sem rompimentos", required: true },
    { id: "c6", category: "Proteção", description: "Presença de protetores de canto ou luvas de proteção em boas condições", required: true },
    { id: "c7", category: "Condição Física", description: "Ausência de nós ou torções", required: true },
    { id: "c8", category: "Capacidade", description: "Capacidade nominal adequada à carga a ser içada", required: true },
  ],
  
  manilha: [
    { id: "m1", category: "Identificação", description: "Corpo e pino identificados com capacidade de carga e fabricante", required: true },
    { id: "m2", category: "Rosca", description: "Rosca do pino em bom estado, sem travamentos ou folgas", required: true },
    { id: "m3", category: "Integridade", description: "Ausência de trincas, amassados ou deformações", required: true },
    { id: "m4", category: "Corrosão", description: "Ausência de corrosão acentuada", required: true },
    { id: "m5", category: "Fixação", description: "Pino fixado corretamente e totalmente rosqueado", required: true },
    { id: "m6", category: "Modificações", description: "Ausência de soldas ou modificações não originais", required: true },
  ],
  
  gancho: [
    { id: "g1", category: "Segurança", description: "Presença de trava de segurança funcional", required: true },
    { id: "g2", category: "Deformação", description: "Sem deformações (abertura do gancho dentro do limite especificado)", required: true },
    { id: "g3", category: "Integridade", description: "Ausência de trincas, desgaste ou corrosão", required: true },
    { id: "g4", category: "Identificação", description: "Identificação legível da carga de trabalho segura (LCT)", required: true },
    { id: "g5", category: "Movimento", description: "Giro e articulação livres, sem travamentos", required: true },
    { id: "g6", category: "Modificações", description: "Ausência de soldas ou reparos não originais", required: true },
  ],
  
  corrente_icamento: [
    { id: "co1", category: "Identificação", description: "Identificação legível da capacidade, fabricante e número de série", required: true },
    { id: "co2", category: "Elos", description: "Ausência de elos alongados, trincados ou gastos acima do limite", required: true },
    { id: "co3", category: "Conectores", description: "Ganchos, anéis e conectores em boas condições", required: true },
    { id: "co4", category: "Condição Física", description: "Corrente sem torções, nós ou deformações", required: true },
    { id: "co5", category: "Especificação", description: "Grau da corrente adequado (ex.: Grau 8 ou 10)", required: true },
    { id: "co6", category: "Manutenção", description: "Lubrificação adequada e sem corrosão excessiva", required: true },
  ],
};

export const checklistTypeLabels: Record<ChecklistType, string> = {
  empilhadeira: 'Checklist de Equipamentos Móveis',
  cinta_icamento: 'Cintas de Içamento (têxteis ou sintéticas)',
  manilha: 'Manilhas (tipo lira ou reta)',
  gancho: 'Ganchos',
  corrente_icamento: 'Correntes de Içamento (ou Lingas de Corrente)',
};

export const checklistTypeIcons: Record<ChecklistType, string> = {
  empilhadeira: '🚜',
  cinta_icamento: '🧵',
  manilha: '🪝',
  gancho: '⚙️',
  corrente_icamento: '🔗',
};

export const getChecklistItems = (type: ChecklistType): LiftingChecklistItem[] => {
  return liftingAccessoryChecklists[type] || [];
};
