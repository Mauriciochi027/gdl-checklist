import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/LoginForm';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import EquipmentList from '@/components/EquipmentList';
import ChecklistForm from '@/components/ChecklistForm';
import ChecklistHistory from '@/components/ChecklistHistory';
import ApprovalsPage from '@/components/ApprovalsPage';
import StatusPanel from '@/components/StatusPanel';
import UserManagement from '@/components/UserManagement';
import { OperationControl } from '@/components/OperationControl';
import { getChecklistItemById } from '@/lib/checklistItems';
import { Equipment, ChecklistRecord } from '@/types/equipment';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [equipments, setEquipments] = useState([
    { id: "1", code: "EMP-001", model: "7FBR15", brand: "Toyota", year: 2022, sector: "Armazém", status: "active" as const, lastCheck: "2024-01-15", nextMaintenance: "2024-02-15", photo: "" },
    { id: "2", code: "EMP-002", model: "H50", brand: "Hyster", year: 2021, sector: "Expedição", status: "active" as const, lastCheck: "2024-01-14", nextMaintenance: "2024-02-20", photo: "" },
    { id: "3", code: "EMP-003", model: "FG25", brand: "Caterpillar", year: 2023, sector: "Recebimento", status: "maintenance" as const, lastCheck: "2024-01-10", nextMaintenance: "2024-01-25", photo: "" }
  ]);

  const [checklistRecords, setChecklistRecords] = useState([
    {
      id: "1",
      equipmentCode: "EMP-001", 
      equipmentModel: "Toyota 7FBR15",
      operatorName: "João Silva",
      timestamp: "2024-01-15T08:30:00",
      status: "pendente" as const,
      totalItems: 18,
      conformeItems: 16,
      naoConformeItems: 2,
      signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      approvals: [],
      answers: [
        { question: "Status do cinto de segurança", answer: "Sim", conformidade: "conforme", photos: [] },
        { question: "Status do freio", answer: "Não", conformidade: "nao_conforme", observation: "Necessário verificar sistema hidráulico", photos: [] }
      ]
    },
    {
      id: "2",
      equipmentCode: "EMP-002", 
      equipmentModel: "Hyster H50",
      operatorName: "João Silva",
      timestamp: "2024-01-14T09:15:00",
      status: "conforme" as const,
      totalItems: 18,
      conformeItems: 18,
      naoConformeItems: 0,
      signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      approvals: [{
        mechanicName: "Carlos Mecânico",
        timestamp: "2024-01-14T10:30:00",
        comment: "Equipamento em perfeitas condições"
      }],
      answers: [
        { question: "Status do cinto de segurança", answer: "Sim", conformidade: "conforme", photos: [] },
        { question: "Condições do assento", answer: "Sim", conformidade: "conforme", photos: [] },
        { question: "Status do freio", answer: "Sim", conformidade: "conforme", photos: [] }
      ]
    },
    {
      id: "3",
      equipmentCode: "EMP-003", 
      equipmentModel: "Caterpillar FG25",
      operatorName: "João Silva",
      timestamp: "2024-01-13T14:20:00",
      status: "negado" as const,
      totalItems: 18,
      conformeItems: 15,
      naoConformeItems: 3,
      signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      approvals: [],
      rejections: [{
        mechanicName: "Carlos Mecânico",
        timestamp: "2024-01-13T15:45:00",
        reason: "Problemas críticos de segurança detectados. Equipamento deve ser retirado de operação imediatamente."
      }],
      answers: [
        { question: "Status do cinto de segurança", answer: "Não", conformidade: "nao_conforme", observation: "Cinto danificado", photos: [] },
        { question: "Status do freio", answer: "Não", conformidade: "nao_conforme", observation: "Pedal com problema", photos: [] },
        { question: "Condições do pneu/roda", answer: "Não", conformidade: "nao_conforme", observation: "Desgaste excessivo", photos: [] }
      ]
    }
  ]);

  // Filter data for operators - only show their own checklists
  const getUserFilteredData = () => {
    const isOperator = user?.profile === 'operador';
    const userChecklistRecords = isOperator 
      ? checklistRecords.filter(r => r.operatorName === user?.name)
      : checklistRecords;
    
    return {
      totalEquipments: isOperator ? 1 : equipments.length, // Operators see only equipment they use
      todayChecklists: isOperator ? userChecklistRecords.length : 12,
      pendingApprovals: userChecklistRecords.filter(r => r.status === 'pendente').length,
      nonConformItems: isOperator 
        ? userChecklistRecords.reduce((sum, r) => sum + r.naoConformeItems, 0)
        : 3,
      avgResponseTime: 15,
      topIssues: isOperator 
        ? [] // Operators don't see top issues comparison
        : [
            { equipment: "EMP-045", issues: 5 },
            { equipment: "EMP-023", issues: 3 },
            { equipment: "EMP-067", issues: 2 }
          ],
      recentChecklists: isOperator ? userChecklistRecords.slice(0, 5) : undefined
    };
  };
  
  const dashboardData = getUserFilteredData();

  const handleAddEquipment = (equipment: any) => {
    const newEquipment = { ...equipment, id: Date.now().toString() };
    setEquipments([...equipments, newEquipment]);
  };

  const handleUpdateEquipment = (id: string, updates: any) => {
    setEquipments(equipments.map(eq => eq.id === id ? { ...eq, ...updates } : eq));
  };

  const handleSubmitChecklist = (data: any) => {
    // Determine status based on answers
    const hasNonConformItems = data.answers.some((a: any) => a.value === 'nao');
    const status: 'pendente' | 'conforme' = hasNonConformItems ? 'pendente' : 'conforme';

    const eq = equipments.find(eq => eq.id === data.equipmentId);
    
    const newRecord = {
      id: Date.now().toString(),
      equipmentCode: eq?.code ?? "",
      equipmentModel: eq ? `${eq.brand} ${eq.model}` : "",
      operatorName: user?.name || data.operatorName,
      timestamp: data.timestamp,
      status,
      totalItems: data.answers.length,
      conformeItems: data.answers.filter((a: any) => a.value === 'sim').length,
      naoConformeItems: data.answers.filter((a: any) => a.value === 'nao').length,
      signature: data.signature,
      approvals: status === 'conforme' ? [{
        mechanicName: "Sistema",
        timestamp: new Date().toISOString(),
        comment: "Checklist aprovado automaticamente - todos os itens conformes"
      }] : [],
      answers: data.answers.map((a: any) => {
        const checklistItem = getChecklistItemById(a.itemId);
        return {
          question: checklistItem?.description || `Item ${a.itemId}`,
          answer: a.value === 'sim' ? 'Sim' : a.value === 'nao' ? 'Não' : 'N/A',
          conformidade: a.value === 'sim' ? 'conforme' : a.value === 'nao' ? 'nao_conforme' : 'nao_aplica',
          observation: a.observation,
          photos: data.photos?.[a.itemId] || [],
          category: checklistItem?.category
        };
      })
    };
    setChecklistRecords(prev => [newRecord, ...prev]);
  };

  const handleApproveRecord = (recordId: string, mechanicName: string, comment: string) => {
    setChecklistRecords(records => 
      records.map(record => 
        record.id === recordId 
          ? {
              ...record,
              status: 'conforme' as const,
              approvals: [...(record.approvals || []), {
                mechanicName,
                timestamp: new Date().toISOString(),
                comment
              }] as Array<{ mechanicName: string; timestamp: string; comment: string; }>
            } as any
          : record
      )
    );
  };

  const handleRejectRecord = (recordId: string, mechanicName: string, reason: string) => {
    setChecklistRecords(records => 
      records.map(record => 
        record.id === recordId 
          ? {
              ...record,
              status: 'negado' as const,
              rejections: [...(record.rejections || []), {
                mechanicName,
                timestamp: new Date().toISOString(),
                reason
              }] as Array<{ mechanicName: string; timestamp: string; reason: string; }>
            } as any
          : record
      )
    );
  };

  const handleUpdateEquipmentStatus = (equipmentId: string, status: string, reason?: string) => {
    // Esta função seria implementada para atualizar o status do equipamento
    // Por enquanto, apenas log para demonstração
    console.log(`Atualizando status do equipamento ${equipmentId} para ${status}`, reason);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard 
          data={dashboardData}
          userProfile={user?.profile}
          currentUser={user}
          onApproveRecord={(recordId: string, comment: string) => handleApproveRecord(recordId, user?.name || 'Mecânico', comment)}
          onRejectRecord={(recordId: string, reason: string) => handleRejectRecord(recordId, user?.name || 'Mecânico', reason)}
        />;
      case 'users':
        return <UserManagement currentUser={user} />;
      case 'status':
        return <StatusPanel
          equipments={equipments}
          checklistRecords={checklistRecords}
          userProfile={user?.profile}
          onUpdateEquipmentStatus={handleUpdateEquipmentStatus}
        />;
      case 'approvals':
        return <ApprovalsPage 
          records={checklistRecords}
          onApproveRecord={(recordId: string, mechanicName: string, comment: string) => handleApproveRecord(recordId, mechanicName, comment)}
          onRejectRecord={(recordId: string, mechanicName: string, reason: string) => handleRejectRecord(recordId, mechanicName, reason)}
          currentUser={user}
        />;
      case 'equipments':
        return <EquipmentList equipments={equipments} onAddEquipment={handleAddEquipment} onUpdateEquipment={handleUpdateEquipment} />;
      case 'checklist':
        return <ChecklistForm equipments={equipments} onSubmitChecklist={handleSubmitChecklist} />;
      case 'history':
        return <ChecklistHistory 
          records={checklistRecords} 
          userProfile={user?.profile}
          currentUser={user}
        />;
      default:
        return <Dashboard 
          data={dashboardData} 
          userProfile={user?.profile} 
          currentUser={user} 
        />;
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar tela de login se não estiver autenticado
  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default Index;
