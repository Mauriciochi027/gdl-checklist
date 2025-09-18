export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  isCritical?: boolean;
}

export const checklistItems: ChecklistItem[] = [
  // Itens específicos do sistema de empilhadeiras
  { id: "1", category: "Segurança", description: "Status do cinto de segurança", required: true, isCritical: true },
  { id: "2", category: "Segurança", description: "Condições do assento", required: true },
  { id: "3", category: "Painel", description: "Condições do painel", required: true },
  { id: "4", category: "Sistema Hidráulico", description: "Há vazamento hidráulico", required: true },
  { id: "5", category: "Segurança", description: "Sinal sonoro 'buzina'", required: true },
  { id: "6", category: "Controles", description: "Condições dos pedais", required: true },
  { id: "7", category: "Freios e Direção", description: "Status do freio", required: true, isCritical: true },
  { id: "8", category: "Pneus e Rodas", description: "Condições do pneu/roda", required: true, isCritical: true },
  { id: "9", category: "Segurança", description: "Status dos retrovisores", required: true },
  { id: "10", category: "Sinalização", description: "Condição do giroflex", required: true },
  { id: "11", category: "Sinalização", description: "Sinal sonoro 'ré'", required: true },
  { id: "12", category: "Segurança", description: "Extintor", required: true, isCritical: true },
  { id: "13", category: "Iluminação", description: "Status dos faróis", required: true },
  { id: "14", category: "Garfos e Mastro", description: "Status da torre e corrente", required: true, isCritical: true },
  { id: "15", category: "Garfos e Mastro", description: "Status do spreader e lâmpada", required: true },
  { id: "16", category: "Garfos e Mastro", description: "Status do encosto de carga", required: true },
  { id: "17", category: "Liberação", description: "Empilhadeira apta para uso", required: true }
];

export const getChecklistItemById = (id: string): ChecklistItem | undefined => {
  return checklistItems.find(item => item.id === id);
};