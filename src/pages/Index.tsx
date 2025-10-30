import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useEquipment } from '@/hooks/useEquipment';
import { useChecklists } from '@/hooks/useChecklists';
import { useAppSync } from '@/hooks/useAppSync';
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
import EquipmentManagement from '@/components/EquipmentManagement';
import { OperationControl } from '@/components/OperationControl';
import { getChecklistItemById } from '@/lib/checklistItems';
import { Equipment } from '@/types/equipment';

const Index = () => {
  const { user, isLoading } = useAuth();
  const { canAccess } = usePermissions(user);
  const { equipments, isLoading: isLoadingEquipments, addEquipment, updateEquipment, refreshEquipments } = useEquipment();
  const { checklistRecords, isLoading: isLoadingChecklists, addChecklist, approveChecklist, rejectChecklist, refreshChecklists } = useChecklists();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedChecklistType, setSelectedChecklistType] = useState<ChecklistType | null>(null);
  const [showLiftingAccessorySelection, setShowLiftingAccessorySelection] = useState(false);

  // Sincronizar dados quando o app volta ao foco (importante para PWA)
  const syncData = useCallback(() => {
    console.log('[Index] Sincronizando dados...');
    refreshEquipments();
    refreshChecklists();
  }, [refreshEquipments, refreshChecklists]);

  useAppSync(syncData);

  // Redirecionar para dashboard se usuário não tiver permissão para a página atual
  // IMPORTANTE: Memoizar verificação para evitar loops
  useEffect(() => {
    if (!user) return;
    
    if (currentPage !== 'dashboard') {
      const pagePermission = currentPage as any;
      if (!canAccess(pagePermission)) {
        console.log('[Index] Usuário sem permissão para', currentPage, '- redirecionando para dashboard');
        setCurrentPage('dashboard');
      }
    }
  }, [user?.id, currentPage, canAccess]); // Usar user.id em vez de user inteiro

  // Filter data for operators - only show their own checklists
  const getUserFilteredData = () => {
    const isOperator = user?.profile === 'operador';
    const userChecklistRecords = isOperator 
      ? checklistRecords.filter(r => r.operatorName === user?.name)
      : checklistRecords;
    
    // Calcular checklists de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChecklists = userChecklistRecords.filter(r => {
      const checklistDate = new Date(r.timestamp);
      checklistDate.setHours(0, 0, 0, 0);
      return checklistDate.getTime() === today.getTime();
    }).length;
    
    // Calcular itens não conformes totais
    const nonConformItems = userChecklistRecords.reduce((sum, r) => sum + r.naoConformeItems, 0);
    
    // Calcular tempo médio de resposta (aprovação) em minutos
    const approvedChecklists = userChecklistRecords.filter(r => r.status === 'conforme' && r.approvals && r.approvals.length > 0);
    const avgResponseTime = approvedChecklists.length > 0
      ? Math.round(
          approvedChecklists.reduce((sum, r) => {
            const created = new Date(r.timestamp).getTime();
            const approved = r.approvals && r.approvals[0] 
              ? new Date(r.approvals[0].timestamp).getTime() 
              : created;
            return sum + (approved - created) / (1000 * 60); // Converter para minutos
          }, 0) / approvedChecklists.length
        )
      : 0;
    
    // Calcular top issues (equipamentos com mais problemas)
    const equipmentIssues = new Map<string, number>();
    userChecklistRecords.forEach(r => {
      if (r.naoConformeItems > 0) {
        const current = equipmentIssues.get(r.equipmentCode) || 0;
        equipmentIssues.set(r.equipmentCode, current + r.naoConformeItems);
      }
    });
    
    const topIssues = isOperator 
      ? [] // Operators don't see top issues comparison
      : Array.from(equipmentIssues.entries())
          .map(([equipment, issues]) => ({ equipment, issues }))
          .sort((a, b) => b.issues - a.issues)
          .slice(0, 3);
    
    // Calcular alertas recentes (checklists com status negado ou pendente)
    const recentAlerts = userChecklistRecords
      .filter(r => r.status === 'negado' || r.status === 'pendente')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        type: r.status === 'negado' ? 'error' : 'warning',
        title: r.status === 'negado' ? 'Não Conformidade' : 'Aguardando Aprovação',
        message: `${r.equipmentCode} - ${r.operatorName}`,
        time: new Date(r.timestamp)
      }));
    
    return {
      totalEquipments: isOperator ? 1 : equipments.length,
      todayChecklists,
      pendingApprovals: userChecklistRecords.filter(r => r.status === 'pendente').length,
      nonConformItems,
      avgResponseTime,
      topIssues,
      recentAlerts,
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

  const handleUpdateEquipmentStatus = async (equipmentId: string, status: string, reason?: string) => {
    await updateEquipment(equipmentId, {
      status: status as Equipment['status'],
      observations: reason || undefined
    });
    // Recarregar a lista de equipamentos para mostrar a atualização
    await refreshEquipments();
  };

  const renderPage = () => {
    // Verificar permissão antes de renderizar qualquer página (exceto dashboard)
    if (currentPage !== 'dashboard' && !canAccess(currentPage as any)) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      );
    }

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
      case 'equipment-management':
        return <EquipmentManagement equipments={equipments} />;
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
