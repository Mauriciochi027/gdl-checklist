import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/hooks/useAuth';

interface UserManagementProps {
  currentUser: User | null;
}

const UserManagement = ({
  currentUser
}: UserManagementProps) => {
  const {
    toast
  } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    profile: 'operador' as 'operador' | 'mecanico' | 'admin',
    matricula: ''
  });

  // Carregar usuários do localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('checklist_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  // Salvar usuários no localStorage
  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem('checklist_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  // Filtrar usuários pela busca
  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.matricula?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddUser = () => {
    // Validações
    if (!formData.username || !formData.password || !formData.name) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    // Verificar se username já existe
    if (users.some(u => u.username === formData.username)) {
      toast({
        title: 'Erro',
        description: 'Nome de usuário já existe',
        variant: 'destructive'
      });
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      username: formData.username,
      name: formData.name,
      profile: formData.profile,
      matricula: formData.matricula
    };

    // Salvar senha em estrutura separada
    const passwords = JSON.parse(localStorage.getItem('checklist_passwords') || '{}');
    passwords[formData.username] = formData.password;
    localStorage.setItem('checklist_passwords', JSON.stringify(passwords));
    saveUsers([...users, newUser]);
    toast({
      title: 'Sucesso',
      description: 'Usuário criado com sucesso'
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    // Validações
    if (!formData.name) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      });
      return;
    }
    const updatedUsers = users.map(u => u.id === selectedUser.id ? {
      ...u,
      name: formData.name,
      profile: formData.profile,
      matricula: formData.matricula
    } : u);

    // Atualizar senha se fornecida
    if (formData.password) {
      const passwords = JSON.parse(localStorage.getItem('checklist_passwords') || '{}');
      passwords[selectedUser.username] = formData.password;
      localStorage.setItem('checklist_passwords', JSON.stringify(passwords));
    }
    saveUsers(updatedUsers);

    // Atualizar usuário no localStorage se for o usuário logado
    const storedUser = localStorage.getItem('checklist_user');
    if (storedUser) {
      const currentStoredUser = JSON.parse(storedUser);
      if (currentStoredUser.id === selectedUser.id) {
        localStorage.setItem('checklist_user', JSON.stringify(updatedUsers.find(u => u.id === selectedUser.id)));
      }
    }
    toast({
      title: 'Sucesso',
      description: 'Usuário atualizado com sucesso'
    });
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    // Não permitir deletar o próprio usuário
    if (selectedUser.id === currentUser?.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode deletar seu próprio usuário',
        variant: 'destructive'
      });
      return;
    }
    const updatedUsers = users.filter(u => u.id !== selectedUser.id);
    saveUsers(updatedUsers);

    // Remover senha
    const passwords = JSON.parse(localStorage.getItem('checklist_passwords') || '{}');
    delete passwords[selectedUser.username];
    localStorage.setItem('checklist_passwords', JSON.stringify(passwords));
    toast({
      title: 'Sucesso',
      description: 'Usuário deletado com sucesso'
    });
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      profile: user.profile,
      matricula: user.matricula || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      profile: 'operador',
      matricula: ''
    });
    setShowPassword(false);
  };

  const getProfileBadge = (profile: string) => {
    const badges = {
      operador: {
        label: 'Operador',
        variant: 'default' as const
      },
      mecanico: {
        label: 'Mecânico',
        variant: 'secondary' as const
      },
      admin: {
        label: 'Admin',
        variant: 'destructive' as const
      }
    };
    return badges[profile as keyof typeof badges] || {
      label: profile,
      variant: 'default' as const
    };
  };

  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários e seus perfis de acesso</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Usuários</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar usuários..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow> : filteredUsers.map(user => {
              const badge = getProfileBadge(user.profile);
              return <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>{user.matricula || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(user)} disabled={user.id === currentUser?.id}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>;
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Adicionar Usuário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input id="username" value={formData.username} onChange={e => setFormData({
              ...formData,
              username: e.target.value
            })} placeholder="usuario123" />
            </div>
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" type="password" value={formData.password} onChange={e => setFormData({
              ...formData,
              password: e.target.value
            })} placeholder="••••••" />
            </div>
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="João Silva" />
            </div>
            <div>
              <Label htmlFor="profile">Perfil</Label>
              <Select value={formData.profile} onValueChange={(value: any) => setFormData({
              ...formData,
              profile: value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="mecanico">Mecânico</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input id="matricula" value={formData.matricula} onChange={e => setFormData({
              ...formData,
              matricula: e.target.value
            })} placeholder="OP001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>Criar Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" value={formData.username} disabled className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="edit-password">Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="edit-password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={e => setFormData({
                    ...formData,
                    password: e.target.value
                  })} 
                  placeholder="••••••"
                  className="pr-10"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input id="edit-name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="João Silva" />
            </div>
            <div>
              <Label htmlFor="edit-profile">Perfil</Label>
              <Select value={formData.profile} onValueChange={(value: any) => setFormData({
              ...formData,
              profile: value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="mecanico">Mecânico</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-matricula">Matrícula</Label>
              <Input id="edit-matricula" value={formData.matricula} onChange={e => setFormData({
              ...formData,
              matricula: e.target.value
            })} placeholder="OP001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{selectedUser?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};

export default UserManagement;
