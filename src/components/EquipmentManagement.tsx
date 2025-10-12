import { Truck, Wrench, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEquipment } from '@/hooks/useEquipment';
import forkliftIcon from '@/assets/forklift-icon.png';
import mechanicIcon from '@/assets/mechanic-icon.jpg';

interface EquipmentManagementProps {
  equipments: any[];
}

const EquipmentManagement = ({ equipments }: EquipmentManagementProps) => {
  const { refreshEquipments } = useEquipment();

  // Mapear status do banco para status de exibição
  const isOperating = (status: string) => {
    const operatingStatuses = ['active', 'disponível', 'em operação', 'disponivel', 'operando'];
    return operatingStatuses.includes(status?.toLowerCase() || '');
  };

  const isStopped = (status: string) => {
    const stoppedStatuses = ['manutenção', 'indisponível', 'maintenance', 'stopped', 'parado', 'manutencao', 'indisponivel'];
    return stoppedStatuses.includes(status?.toLowerCase() || '');
  };

  // Calcular estatísticas
  const operatingEquipments = equipments.filter(eq => isOperating(eq.status)).length;
  const stoppedEquipments = equipments.filter(eq => isStopped(eq.status)).length;
  const totalEquipments = equipments.length;
  
  const availability = totalEquipments > 0 ? ((operatingEquipments / totalEquipments) * 100).toFixed(1) : '0.0';
  const unavailability = totalEquipments > 0 ? ((stoppedEquipments / totalEquipments) * 100).toFixed(1) : '0.0';

  // Equipamentos paralisados
  const stoppedEquipmentsList = equipments.filter(eq => isStopped(eq.status));

  const handleRefresh = async () => {
    await refreshEquipments();
  };

  return (
    <div className="space-y-6 min-h-screen p-6" style={{ backgroundColor: '#58758C' }}>
      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white uppercase tracking-wide">
          Gestão de Equipamentos Móveis - MANUT
        </h1>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card: Equipamentos em Operação */}
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">
                  Equipamentos em Operação
                </p>
                <p className="text-5xl font-bold text-green-600">
                  {operatingEquipments}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F36F21' }}>
                <img src={forkliftIcon} alt="Empilhadeira" className="w-10 h-10 object-contain filter brightness-0 invert" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Equipamentos Parados */}
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">
                  Equipamentos Parados
                </p>
                <p className="text-5xl font-bold text-red-600">
                  {stoppedEquipments}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F36F21' }}>
                <img src={mechanicIcon} alt="Mecânico" className="w-10 h-10 object-cover rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Disponibilidade Geral */}
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">
                  Disponibilidade Geral
                </p>
                <p className="text-4xl font-bold text-green-600">
                  {availability}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12" style={{ color: '#F36F21' }} />
            </div>
          </CardContent>
        </Card>

        {/* Card: Indisponibilidade Geral */}
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">
                  Indisponibilidade Geral
                </p>
                <p className="text-4xl font-bold text-red-600">
                  {unavailability}%
                </p>
              </div>
              <TrendingDown className="w-12 h-12" style={{ color: '#F36F21' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Atualizar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh}
          className="bg-white text-gray-700 hover:bg-gray-100 shadow-md"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          📊 Atualizar Dados
        </Button>
      </div>

      {/* Tabela de Equipamentos Paralisados */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4" style={{ backgroundColor: '#F36F21' }}>
          <h2 className="text-xl font-bold text-white uppercase text-center">
            Relação de Equipamentos Paralisados
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="font-bold text-gray-700">Equipamento: Modelo</TableHead>
                <TableHead className="font-bold text-gray-700">Equipamento: Identificação</TableHead>
                <TableHead className="font-bold text-gray-700">Oficina</TableHead>
                <TableHead className="font-bold text-gray-700">Descrição da OS</TableHead>
                <TableHead className="font-bold text-gray-700">Data e Horário de Parada</TableHead>
                <TableHead className="font-bold text-gray-700">Tipo de Manutenção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stoppedEquipmentsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum equipamento paralisado no momento
                  </TableCell>
                </TableRow>
              ) : (
                stoppedEquipmentsList.map((equipment, index) => (
                  <TableRow 
                    key={equipment.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <TableCell className="font-medium">
                      {equipment.brand} {equipment.model}
                    </TableCell>
                    <TableCell>{equipment.code}</TableCell>
                    <TableCell>{equipment.sector || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {equipment.observations || 'Sem descrição'}
                    </TableCell>
                    <TableCell>
                      {equipment.updated_at 
                        ? new Date(equipment.updated_at).toLocaleString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        equipment.status === 'Manutenção' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {equipment.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 bg-gray-50 border-t text-center text-sm text-gray-600">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default EquipmentManagement;