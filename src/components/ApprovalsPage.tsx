import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PhotoGrid } from "@/components/ui/photo-viewer";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  Eye,
  Calendar,
  FileText,
  Camera,
  PenTool
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
      category: item?.category,
      photos: photos?.[answer.itemId] || []
    };
  });
};

interface ApprovalsPageProps {
  records: ChecklistRecord[];
  isLoading: boolean;
  onApproveRecord: (recordId: string, mechanicName: string, comment: string) => void;
  onRejectRecord: (recordId: string, mechanicName: string, reason: string) => void;
  currentUser?: { name: string; matricula?: string };
}

const ApprovalsPage = ({ records, isLoading, onApproveRecord, onRejectRecord, currentUser }: ApprovalsPageProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedRecord, setSelectedRecord] = useState<ChecklistRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Filter records for pending approvals
  const pendingRecords = records.filter(record => record.status === 'pendente');

  // Apply filters
  const filteredRecords = pendingRecords.filter(record => {
    const matchesSearch = record.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.equipmentModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.operatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  const getCriticalityBadge = (record: ChecklistRecord) => {
    const criticality = record.naoConformeItems > 2 ? 'crítico' : 
                       record.naoConformeItems > 0 ? 'atenção' : 'normal';
    
    switch (criticality) {
      case 'crítico':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'atenção':
        return <Badge className="bg-safety-orange text-white">Atenção</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const handleApproval = () => {
    if (selectedRecord && approvalComment.trim()) {
      onApproveRecord(selectedRecord.id, currentUser?.name || 'Mecânico', approvalComment);
      setIsApprovalDialogOpen(false);
      setApprovalComment("");
      setSelectedRecord(null);
      toast({
        title: "Checklist Aprovado",
        description: `Checklist ${selectedRecord.equipmentCode} foi aprovado com sucesso.`,
      });
    }
  };

  const handleRejection = () => {
    if (selectedRecord && rejectionReason.trim()) {
      onRejectRecord(selectedRecord.id, currentUser?.name || 'Mecânico', rejectionReason);
      setIsRejectionDialogOpen(false);
      setRejectionReason("");
      setSelectedRecord(null);
      toast({
        title: "Checklist Negado",
        description: `Checklist ${selectedRecord.equipmentCode} foi negado.`,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Aprovações Pendentes</h2>
        <p className="text-gray-600">
          Gerencie e aprove os checklists que aguardam sua análise
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por equipamento ou operador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {filteredRecords.length} de {pendingRecords.length} aprovações pendentes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-industrial-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando aprovações pendentes...</p>
        </div>
      )}

      {/* Pending Approvals List */}
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
                          {getCriticalityBadge(record)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Operador:</span>
                            <span>{record.operatorName}</span>
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
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsApprovalDialogOpen(true);
                        }}
                        className="bg-safety-green hover:bg-safety-green-dark text-white"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsRejectionDialogOpen(true);
                        }}
                        className="border-safety-red text-safety-red hover:bg-safety-red hover:text-white"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Negar
                      </Button>
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
                 <Clock className="w-8 h-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 Nenhuma aprovação pendente
               </h3>
               <p className="text-gray-600">
                 {searchTerm ? 'Nenhum resultado encontrado para sua busca.' : 'Todos os checklists foram processados.'}
               </p>
             </CardContent>
           </Card>
         )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Checklist</DialogTitle>
            <DialogDescription>
              {selectedRecord && `${selectedRecord.equipmentCode} - ${selectedRecord.equipmentModel}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Equipment Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-600">Operador:</span>
                  <p className="text-gray-900">{selectedRecord.operatorName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Data/Hora:</span>
                  <p className="text-gray-900">
                    {formatDateTime(selectedRecord.timestamp).dateStr} às {formatDateTime(selectedRecord.timestamp).timeStr}
                  </p>
                </div>
              </div>

              {/* Answers */}
              {selectedRecord.checklistAnswers && (
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
                            {answer.category && (
                              <div className="text-xs text-gray-500">
                                Categoria: {answer.category}
                              </div>
                            )}
                          </div>
                          
                          {/* Answer and Conformity */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1">
                              <span className="text-sm text-gray-600">Resposta:</span>
                              <p className="text-gray-900 font-medium mt-1">{answer.answer}</p>
                            </div>
                            <Badge 
                              variant={answer.conformidade === 'conforme' ? 'default' : 'destructive'}
                              className={`${answer.conformidade === 'conforme' ? 'bg-safety-green text-white' : 
                                          answer.conformidade === 'nao_conforme' ? 'bg-safety-red text-white' : 
                                          'bg-gray-500 text-white'} shrink-0`}
                            >
                              {answer.conformidade === 'conforme' ? 'Conforme' : 
                               answer.conformidade === 'nao_conforme' ? 'Não Conforme' : 'N/A'}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Checklist</DialogTitle>
            <DialogDescription>
              {selectedRecord && `Aprovar checklist ${selectedRecord.equipmentCode} - ${selectedRecord.equipmentModel}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Comentário (opcional):
              </label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Adicione um comentário sobre a aprovação..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApproval}
              className="bg-safety-green hover:bg-safety-green-dark text-white"
            >
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negar Checklist</DialogTitle>
            <DialogDescription>
              {selectedRecord && `Negar checklist ${selectedRecord.equipmentCode} - ${selectedRecord.equipmentModel}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Motivo da negação *:
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da negação..."
                className="mt-1"
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRejection}
              variant="destructive"
              disabled={!rejectionReason.trim()}
            >
              Confirmar Negação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;