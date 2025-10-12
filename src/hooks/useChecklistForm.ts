import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { ChecklistAnswer } from '@/types/equipment';
import { ChecklistItem } from '@/lib/checklistItems';
import { LiftingChecklistItem } from '@/lib/liftingAccessoryChecklists';

/**
 * Hook customizado para gerenciar estado de formulário de checklist
 * Centraliza lógica compartilhada e reduz duplicação
 */
export const useChecklistForm = () => {
  const { user } = useAuth();
  
  // Estados do formulário
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("");
  const [operatorId, setOperatorId] = useState<string>("");
  const [equipmentModel, setEquipmentModel] = useState<"eletrica" | "combustao" | "">("");
  const [location, setLocation] = useState<string>("");
  const [unit, setUnit] = useState<"01" | "02" | "03" | "">("");
  const [equipmentSeries, setEquipmentSeries] = useState<string>("");
  const [equipmentNumber, setEquipmentNumber] = useState<string>("");
  const [hourMeter, setHourMeter] = useState<string>("");
  const [operationDescription, setOperationDescription] = useState<string>("");
  const [loadDescription, setLoadDescription] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({});
  const [signature, setSignature] = useState<string>("");
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [qrScanned, setQrScanned] = useState<boolean>(false);

  // Preenche dados do operador quando usuário estiver disponível
  useEffect(() => {
    if (user) {
      setOperatorName(user.name);
      setOperatorId(user.matricula || "");
    }
  }, [user]);

  // Handlers para respostas do checklist
  const handleAnswerChange = (itemId: string, value: 'sim' | 'nao' | 'nao_aplica') => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        value,
        observation: prev[itemId]?.observation || ""
      }
    }));
  };

  const handleObservationChange = (itemId: string, observation: string) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        value: prev[itemId]?.value || 'nao',
        observation
      }
    }));
  };

  // Estatísticas do progresso
  const getProgressStats = (checklistItems: (ChecklistItem | LiftingChecklistItem)[]) => {
    const totalItems = checklistItems.length;
    const answeredItems = Object.keys(answers).length;
    const conformeItems = Object.values(answers).filter(a => a.value === 'sim').length;
    const naoConformeItems = Object.values(answers).filter(a => a.value === 'nao').length;
    
    return {
      total: totalItems,
      answered: answeredItems,
      conforme: conformeItems,
      naoConforme: naoConformeItems,
      progress: totalItems > 0 ? Math.round(answeredItems / totalItems * 100) : 0
    };
  };

  // Reset do formulário
  const resetForm = () => {
    setSelectedEquipment("");
    if (user) {
      setOperatorName(user.name);
      setOperatorId(user.matricula || "");
    }
    setEquipmentModel("");
    setLocation("");
    setUnit("");
    setEquipmentSeries("");
    setEquipmentNumber("");
    setHourMeter("");
    setOperationDescription("");
    setLoadDescription("");
    setAnswers({});
    setSignature("");
    setPhotos({});
    setQrScanned(false);
  };

  return {
    // Estados
    selectedEquipment,
    operatorName,
    operatorId,
    equipmentModel,
    location,
    unit,
    equipmentSeries,
    equipmentNumber,
    hourMeter,
    operationDescription,
    loadDescription,
    answers,
    signature,
    photos,
    qrScanned,
    // Setters
    setSelectedEquipment,
    setOperatorName,
    setOperatorId,
    setEquipmentModel,
    setLocation,
    setUnit,
    setEquipmentSeries,
    setEquipmentNumber,
    setHourMeter,
    setOperationDescription,
    setLoadDescription,
    setAnswers,
    setSignature,
    setPhotos,
    setQrScanned,
    // Handlers
    handleAnswerChange,
    handleObservationChange,
    getProgressStats,
    resetForm
  };
};
