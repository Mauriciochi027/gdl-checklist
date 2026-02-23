import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, Search, CircleDot } from 'lucide-react';
import { TireLifeBar } from './TireLifeBar';
import { Tire } from '@/hooks/useTires';

interface TireListProps {
  tires: Tire[];
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (tire: Tire) => void;
  onDelete: (id: string) => void;
  onView: (tire: Tire) => void;
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    estoque: { label: 'Em Estoque', variant: 'secondary' },
    em_uso: { label: 'Em Uso', variant: 'default' },
    em_reforma: { label: 'Em Reforma', variant: 'outline' },
  };
  return badges[status] || { label: status, variant: 'outline' };
};

export const TireList = ({ tires, isLoading, isAdmin, onEdit, onDelete, onView }: TireListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTires = tires.filter((tire) => {
    const matchesSearch = 
      tire.code.toLowerCase().includes(search.toLowerCase()) ||
      tire.model?.toLowerCase().includes(search.toLowerCase()) ||
      tire.equipment?.code.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tire.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CircleDot className="w-5 h-5" />
            Lista de Pneus
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pneu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="estoque">Em Estoque</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="em_reforma">Em Reforma</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTires.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search || statusFilter !== 'all' 
              ? 'Nenhum pneu encontrado com os filtros aplicados.'
              : 'Nenhum pneu cadastrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Vida Útil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTires.map((tire) => {
                  const statusBadge = getStatusBadge(tire.status);
                  return (
                    <TableRow key={tire.id}>
                      <TableCell className="font-medium">{tire.code}</TableCell>
                      <TableCell>{tire.model || '-'}</TableCell>
                      <TableCell>
                        <TireLifeBar
                          initialDepth={tire.initial_depth}
                          currentDepth={tire.latest_depth}
                          compact
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {tire.equipment ? `${tire.equipment.code}` : '-'}
                      </TableCell>
                      <TableCell>{tire.position || '-'}</TableCell>
                      <TableCell>
                        {tire.created_at 
                          ? format(new Date(tire.created_at), "dd/MM/yyyy", { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onView(tire)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(tire)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir pneu?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o pneu {tire.code}? 
                                      Esta ação não pode ser desfeita e todo o histórico de medições será perdido.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDelete(tire.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
