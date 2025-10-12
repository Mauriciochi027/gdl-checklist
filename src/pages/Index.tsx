import { useState } from 'react';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { useEquipment } from '@/hooks/useEquipment';
import { useChecklists } from '@/hooks/useChecklists';
import { LoginForm } from '@/components/LoginForm';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import EquipmentList from '@/components/EquipmentList';
import ChecklistForm from '@/components/ChecklistForm';
import { ChecklistTypeSelection, LiftingAccessorySelection } from '@/components/ChecklistTypeSelection';
import { ChecklistType } from '@/lib/liftingAccessoryChecklists';
import ChecklistHistory from '@/components/ChecklistHistory';
import ApprovalsPage from '@/components/ApprovalsPage';
import StatusPanel from '@/components/StatusPanel';
import UserManagement from '@/components/UserManagement';
import { OperationControl } from '@/components/OperationControl';
import { getChecklistItemById } from '@/lib/checklistItems';

const Index = () => {
  const { user, isLoading } = useAuth();
  const { equipments, isLoading: isLoadingEquipments, addEquipment, updateEquipment } = useEquipment();
  const { checklistRecords, isLoading: isLoadingChecklists, addChecklist, approveChecklist, rejectChecklist } = useChecklists();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedChecklistType, setSelectedChecklistType] = useState<ChecklistType | null>(null);
  const [showLiftingAccessorySelection, setShowLiftingAccessorySelection] = useState(false);

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

  const handleAddEquipment = async (equipment: any) => {
    await addEquipment(equipment);
  };

  const handleUpdateEquipment = async (id: string, updates: any) => {
    await updateEquipment(id, updates);
  };

  const handleSubmitChecklist = async (data: any) => {
    const eq = data.equipmentId ? equipments.find(eq => eq.id === data.equipmentId) : null;
    
    if (!user) return;

    const isLiftingAccessory = data.checklistType !== 'empilhadeira';

    await addChecklist({
      equipmentId: data.equipmentId || null,
      equipmentCode: eq?.code || (isLiftingAccessory ? data.checklistType : data.equipmentNumber || 'N/A'),
      equipmentModel: eq ? `${eq.brand} ${eq.model}` : data.checklistType,
      operatorName: user.name,
      operatorId: user.matricula || user.id,
      answers: data.answers,
      signature: data.signature,
      photos: data.photos,
      checklistType: data.checklistType,
      operationDescription: data.operationDescription,
      loadDescription: data.loadDescription
    });
    
    // Volta para seleção de tipo
    setSelectedChecklistType(null);
    setShowLiftingAccessorySelection(false);
  };

  const handleApproveRecord = async (recordId: string, mechanicName: string, comment: string) => {
    await approveChecklist(recordId, mechanicName, comment);
  };

  const handleRejectRecord = async (recordId: string, mechanicName: string, reason: string) => {
    await rejectChecklist(recordId, mechanicName, reason);
  };

  const handleUpdateEquipmentStatus = (equipmentId: string, status: string, reason?: string) => {
    // Esta função seria implementada para atualizar o status do equipamento
    // Por enquanto, apenas log para demonstração
    console.log(`Atualizando status do equipamento ${equipmentId} para ${status}`, reason);
  };

  const renderPage = () => {
    // Checklist flow with type selection
    if (currentPage === 'checklist') {
      // Step 1: Type selection
      if (!selectedChecklistType && !showLiftingAccessorySelection) {
        return <ChecklistTypeSelection 
          onSelectType={(type) => {
            if (type === 'cinta_icamento') {
              // Show lifting accessory subtypes
              setShowLiftingAccessorySelection(true);
            } else {
              setSelectedChecklistType(type);
            }
          }}
        />;
      }
      
      // Step 2: Lifting accessory subtype selection
      if (showLiftingAccessorySelection) {
        return <LiftingAccessorySelection
          onSelectType={(type) => {
            setSelectedChecklistType(type);
            setShowLiftingAccessorySelection(false);
          }}
          onBack={() => setShowLiftingAccessorySelection(false)}
        />;
      }
      
      // Step 3: Actual checklist form
      if (selectedChecklistType) {
        return <ChecklistForm 
          equipments={equipments} 
          onSubmitChecklist={handleSubmitChecklist}
          checklistType={selectedChecklistType}
          onBack={() => {
            setSelectedChecklistType(null);
          }}
        />;
      }
    }
    
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
      case 'accounts':
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
          isLoading={isLoadingChecklists}
          onApproveRecord={(recordId: string, mechanicName: string, comment: string) => handleApproveRecord(recordId, mechanicName, comment)}
          onRejectRecord={(recordId: string, mechanicName: string, reason: string) => handleRejectRecord(recordId, mechanicName, reason)}
          currentUser={user}
        />;
      case 'equipments':
        return <EquipmentList equipments={equipments} isLoading={isLoadingEquipments} onAddEquipment={handleAddEquipment} onUpdateEquipment={handleUpdateEquipment} />;
      case 'history':
        return <ChecklistHistory 
          records={checklistRecords}
          isLoading={isLoadingChecklists}
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
    <Layout currentPage={currentPage} onPageChange={(page) => {
      setCurrentPage(page);
      // Reset checklist state when navigating away
      if (page !== 'checklist') {
        setSelectedChecklistType(null);
        setShowLiftingAccessorySelection(false);
      }
    }}>
      {renderPage()}
    </Layout>
  );
};

export default Index;
