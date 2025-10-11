import { useState } from 'react';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { useEquipment } from '@/hooks/useEquipment';
import { useChecklists } from '@/hooks/useChecklists';
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

const Index = () => {
  const { user, isLoading } = useAuth();
  const { equipments, isLoading: isLoadingEquipments, addEquipment, updateEquipment } = useEquipment();
  const { checklistRecords, addChecklist, approveChecklist, rejectChecklist } = useChecklists();
  const [currentPage, setCurrentPage] = useState('dashboard');

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
    const eq = equipments.find(eq => eq.id === data.equipmentId);
    
    if (!eq || !user) return;

    await addChecklist({
      equipmentId: eq.id,
      equipmentCode: eq.code,
      equipmentModel: `${eq.brand} ${eq.model}`,
      operatorName: user.name,
      operatorId: user.matricula || user.id,
      answers: data.answers,
      signature: data.signature,
      photos: data.photos
    });
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
        return <EquipmentList equipments={equipments} isLoading={isLoadingEquipments} onAddEquipment={handleAddEquipment} onUpdateEquipment={handleUpdateEquipment} />;
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
