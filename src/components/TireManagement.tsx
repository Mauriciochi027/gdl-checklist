import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Info } from 'lucide-react';
import { useTires, Tire, TireFormData } from '@/hooks/useTires';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { TireStats } from './tires/TireStats';
import { TireList } from './tires/TireList';
import { TireForm } from './tires/TireForm';
import { TireDetails } from './tires/TireDetails';
import { TirePositionDiagram } from './tires/TirePositionDiagram';

const TireManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.profile === 'admin';
  
  const { tires, isLoading, stats, createTire, updateTire, deleteTire } = useTires();
  
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);

  const handleCreate = async (data: TireFormData) => {
    return await createTire(data);
  };

  const handleEdit = (tire: Tire) => {
    setSelectedTire(tire);
    setShowForm(true);
  };

  const handleUpdate = async (data: TireFormData) => {
    if (!selectedTire) return false;
    return await updateTire(selectedTire.id, data);
  };

  const handleView = (tire: Tire) => {
    setSelectedTire(tire);
    setShowDetails(true);
  };

  const handleCloseForm = (open: boolean) => {
    setShowForm(open);
    if (!open) setSelectedTire(null);
  };

  const handleCloseDetails = (open: boolean) => {
    setShowDetails(open);
    if (!open) setSelectedTire(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Controle de Pneus</h1>
          <p className="text-muted-foreground">Gerenciamento de pneus e controle de desgaste</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDiagram(true)}>
            <Info className="w-4 h-4 mr-2" />
            Diagrama de Posições
          </Button>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pneu
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <TireStats stats={stats} />

      {/* List */}
      <TireList
        tires={tires}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={deleteTire}
        onView={handleView}
      />

      {/* Form Dialog */}
      <TireForm
        open={showForm}
        onOpenChange={handleCloseForm}
        onSubmit={selectedTire ? handleUpdate : handleCreate}
        tire={selectedTire}
      />

      {/* Details Dialog */}
      <TireDetails
        open={showDetails}
        onOpenChange={handleCloseDetails}
        tire={selectedTire}
        isAdmin={isAdmin}
      />

      {/* Position Diagram Dialog */}
      <TirePositionDiagram
        open={showDiagram}
        onOpenChange={setShowDiagram}
      />
    </div>
  );
};

export default TireManagement;
