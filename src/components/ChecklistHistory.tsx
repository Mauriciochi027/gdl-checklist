import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { PhotoGrid } from "@/components/ui/photo-viewer";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  AlertTriangle,
  Eye,
  Calendar,
  FileText,
  User,
  Truck,
  Camera,
  PenTool,
  Trash2
} from "lucide-react";

import { ChecklistRecord, ChecklistAnswer } from '@/types/equipment';
import { getChecklistItemById } from '@/lib/checklistItems';

// Helper to transform answers for display
const transformAnswersForDisplay = (answers: ChecklistAnswer[], photos?: Record<string, string[]>) => {
  return answers.map(answer => {
    const item = getChecklistItemById(answer.itemId);
    return {
      question: item?.description || answer.itemId,
      answer: answer.value === 'sim' ? 'Sim' : answer.value === 'nao' ? 'Não' : 'N/A',
      conformidade: answer.value === 'sim' ? 'conforme' : answer.value === 'nao' ? 'nao_conforme' : 'nao_aplica',
      observation: answer.observation,
      photos: photos?.[answer.itemId] || []
    };
  });
};

interface ChecklistHistoryProps {
  records: ChecklistRecord[];
  isLoading: boolean;
  userProfile?: string;
  currentUser?: { name: string; matricula?: string };
}

const ChecklistHistory = ({ records, isLoading, userProfile, currentUser }: ChecklistHistoryProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [monthFilter, setMonthFilter] = useState("todos");
  const [yearFilter, setYearFilter] = useState("todos");
  const [selectedRecord, setSelectedRecord] = useState<ChecklistRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<ChecklistRecord | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()
        .then(({ data }) => setIsAdmin(!!data));
    }
  }, [user]);

  // Get available years and months from records
  const availableYears = [...new Set(records.map(record => 
    new Date(record.timestamp).getFullYear().toString()
  ))].sort((a, b) => b.localeCompare(a));

  const availableMonths = [...new Set(records.map(record => {
    const date = new Date(record.timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))].sort((a, b) => b.localeCompare(a));

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Filter records based on user role (operators only see their own checklists)
  const userFilteredRecords = user?.profile === 'operador' 
    ? records.filter(record => record.operatorName === user.name)
    : records;

  // Apply all filters
  const filteredRecords = userFilteredRecords.filter(record => {
    const matchesSearch = record.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.equipmentModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.operatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || record.status === statusFilter;
    
    const recordDate = new Date(record.timestamp);
    const recordYear = recordDate.getFullYear().toString();
    const recordMonth = `${recordYear}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
    
    const matchesYear = yearFilter === "todos" || recordYear === yearFilter;
    const matchesMonth = monthFilter === "todos" || recordMonth === monthFilter;
    
    return matchesSearch && matchesStatus && matchesYear && matchesMonth;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conforme':
        return <CheckCircle className="w-5 h-5 text-safety-green" />;
      case 'pendente':
        return <Clock className="w-5 h-5 text-safety-orange" />;
      case 'negado':
        return <XCircle className="w-5 h-5 text-safety-red" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conforme':
        return <Badge className="bg-safety-green text-white">Aprovado</Badge>;
      case 'pendente':
        return <Badge className="bg-safety-orange text-white">Pendente</Badge>;
      case 'negado':
        return <Badge className="bg-safety-red text-white">Negado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  const handleDeleteClick = (record: ChecklistRecord) => {
    setChecklistToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!checklistToDelete) return;

    try {
      const { error } = await supabase
        .from('checklist_records')
        .delete()
        .eq('id', checklistToDelete.id);

      if (error) throw error;

      toast({
        title: "Checklist deletado",
        description: `O checklist do equipamento ${checklistToDelete.equipmentCode} foi removido com sucesso.`,
      });

      setDeleteDialogOpen(false);
      setChecklistToDelete(null);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar checklist:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o checklist. Verifique se você tem permissão.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Histórico de Checklists</h2>
        <p className="text-gray-600">
          Consulta e gestão de inspeções realizadas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por equipamento ou operador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="conforme">Aprovado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="negado">Negado</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Filter */}
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Anos</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month Filter */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Meses</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Results count */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {filteredRecords.length} de {userFilteredRecords.length} registros encontrados
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-industrial-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando histórico de checklists...</p>
        </div>
      )}

      {/* Records List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
            const { dateStr, timeStr } = formatDateTime(record.timestamp);
            
            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getStatusIcon(record.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {record.equipmentCode} - {record.equipmentModel}
                          </h3>
                          {getStatusBadge(record.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Operador: {record.operatorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{dateStr} às {timeStr}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-safety-green font-medium">
                            ✓ {record.conformeItems} conformes
                          </span>
                          {record.naoConformeItems > 0 && (
                            <span className="text-safety-red font-medium">
                              ✗ {record.naoConformeItems} não conformes
                            </span>
                          )}
                          <span className="text-gray-600">
                            Total: {record.totalItems} itens
                          </span>
                        </div>

                        {/* Show rejection reason if negated */}
                        {record.status === 'negado' && record.rejections && record.rejections.length > 0 && (
                          <div className="mt-2 p-2 bg-safety-red-light rounded border-l-4 border-safety-red">
                            <p className="text-sm text-safety-red font-medium">
                              Motivo da negação: {record.rejections[record.rejections.length - 1].reason}
                            </p>
                          </div>
                        )}

                        {/* Show approval comment if approved */}
                        {record.status === 'conforme' && record.approvals && record.approvals.length > 0 && (
                          <div className="mt-2 p-2 bg-safety-green-light rounded border-l-4 border-safety-green">
                            <p className="text-sm text-safety-green font-medium">
                              Aprovado por: {record.approvals[record.approvals.length - 1].mechanicName}
                            </p>
                            {record.approvals[record.approvals.length - 1].comment && (
                              <p className="text-sm text-gray-600">
                                {record.approvals[record.approvals.length - 1].comment}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(record)}
                          className="text-safety-red hover:text-safety-red hover:bg-safety-red/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
         ) : (
           <Card>
             <CardContent className="p-12 text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FileText className="w-8 h-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 Nenhum registro encontrado
               </h3>
               <p className="text-gray-600">
                 {searchTerm || statusFilter !== "todos" || monthFilter !== "todos" || yearFilter !== "todos"
                   ? 'Nenhum resultado encontrado para os filtros aplicados.'
                   : 'Nenhum checklist foi realizado ainda.'}
               </p>
             </CardContent>
           </Card>
         )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Detalhes do Checklist
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && `${selectedRecord.equipmentCode} - ${selectedRecord.equipmentModel}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Equipment Info Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Operador:</span>
                  <p className="text-gray-900 font-semibold">{selectedRecord.operatorName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Data/Hora:</span>
                  <p className="text-gray-900">
                    {formatDateTime(selectedRecord.timestamp).dateStr} às {formatDateTime(selectedRecord.timestamp).timeStr}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-safety-green">{selectedRecord.conformeItems}</p>
                  <p className="text-sm text-gray-600">Conformes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-safety-red">{selectedRecord.naoConformeItems}</p>
                  <p className="text-sm text-gray-600">Não Conformes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-700">{selectedRecord.totalItems}</p>
                  <p className="text-sm text-gray-600">Total de Itens</p>
                </div>
              </div>

              {/* Scrollable Answers Section */}
              <div className="flex-1 overflow-y-auto pr-2">

              {/* Answers */}
              {selectedRecord.checklistAnswers && selectedRecord.checklistAnswers.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Respostas do Checklist:
                  </h4>
                  <div className="space-y-4">
                    {transformAnswersForDisplay(selectedRecord.checklistAnswers, selectedRecord.photos).map((answer, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white">
                        <div className="space-y-3">
                          {/* Question */}
                          <div>
                            <h5 className="font-semibold text-gray-900 text-sm mb-2">
                              {index + 1}. {answer.question}
                            </h5>
                          </div>
                          
                          {/* Answer and Conformity */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1">
                              <span className="text-sm text-gray-600">Resposta:</span>
                              <p className="text-gray-900 font-medium mt-1">{answer.answer}</p>
                            </div>
                             <Badge 
                               variant={answer.conformidade === 'conforme' ? 'default' : 'destructive'}
                               className={`${
                                 answer.conformidade === 'conforme' 
                                   ? 'bg-safety-green text-white' 
                                   : answer.conformidade === 'nao_conforme'
                                     ? 'bg-safety-red text-white'
                                     : 'bg-gray-500 text-white'
                               } shrink-0`}
                             >
                               {answer.conformidade === 'conforme' 
                                 ? 'Conforme' 
                                 : answer.conformidade === 'nao_conforme'
                                   ? 'Não Conforme'
                                   : 'N/A'}
                             </Badge>
                          </div>

                          {/* Photos section - if answer has photos */}
                          {answer.photos && answer.photos.length > 0 && (
                            <div className="border-t pt-3">
                              <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <Camera className="w-4 h-4" />
                                Fotos Anexadas ({answer.photos.length}):
                              </h6>
                              <PhotoGrid photos={answer.photos} />
                            </div>
                          )}

                          {/* Observation or comments if available */}
                          {answer.observation && (
                            <div className="border-t pt-3">
                              <span className="text-sm font-medium text-gray-700">Observação:</span>
                              <p className="text-sm text-gray-600 mt-1">{answer.observation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature section */}
              {selectedRecord.signature && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <PenTool className="w-5 h-5" />
                    Assinatura Digital:
                  </h4>
                  <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                    <img 
                      src={selectedRecord.signature} 
                      alt="Assinatura do operador"
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este checklist do equipamento <strong>{checklistToDelete?.equipmentCode}</strong>?
              Esta ação não pode ser desfeita e irá remover todos os dados relacionados (respostas, fotos, aprovações, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-safety-red hover:bg-safety-red/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ChecklistHistory;