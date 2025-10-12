import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementProps {
  currentUser: User | null;
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  profile: 'operador' | 'mecanico' | 'admin';
  matricula?: string;
  permissions?: string[];
}

const AVAILABLE_PERMISSIONS = [
  { id: 'checklist', label: 'Acesso ao Checklist' },
  { id: 'history', label: 'Acesso ao Histórico' },
  { id: 'dashboard', label: 'Acesso ao Painel' },
  { id: 'status', label: 'Acesso ao Status' },
  { id: 'approvals', label: 'Acesso às Aprovações' },
  { id: 'equipments', label: 'Acesso aos Equipamentos' },
  { id: 'accounts', label: 'Gerenciar Contas' },
];

const UserManagement = ({
  currentUser
}: UserManagementProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    profile: 'operador' as 'operador' | 'mecanico' | 'admin',
    matricula: '',
    permissions: [] as string[]
  });

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch permissions for each user
      const usersWithPermissions = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: perms } = await supabase
            .from('user_permissions')
            .select('permission')
            .eq('user_id', profile.id);
          
          return {
            ...profile,
            permissions: perms?.map(p => p.permission) || []
          } as UserProfile;
        })
      );

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    }
  };

  // Filtrar usuários pela busca
  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.matricula?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddUser = async () => {
    if (!formData.username || !formData.name || !formData.password) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create auth user
      const email = `${formData.username}@checklist.local`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            name: formData.name,
            profile: formData.profile,
            matricula: formData.matricula || null,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add role to user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: formData.profile
          });

        if (roleError) throw roleError;

        // Add permissions
        if (formData.permissions.length > 0) {
          const permissionsToInsert = formData.permissions.map(permission => ({
            user_id: authData.user.id,
            permission
          }));

          const { error: permError } = await supabase
            .from('user_permissions')
            .insert(permissionsToInsert);

          if (permError) throw permError;
        }

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso!',
        });

        resetForm();
        setIsAddDialogOpen(false);
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update profile data (name and matricula only - profile is read-only)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          matricula: formData.matricula || null,
        })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Update permissions - remove all existing and add new ones
      const { error: deletePermsError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUser.id);

      if (deletePermsError) throw deletePermsError;

      if (formData.permissions.length > 0) {
        const permissionsToInsert = formData.permissions.map(permission => ({
          user_id: selectedUser.id,
          permission
        }));

        const { error: permError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (permError) throw permError;
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      });

      resetForm();
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    // Prevent deleting own account
    if (selectedUser.id === currentUser?.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode deletar seu próprio usuário.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      toast({
        title: 'Aviso',
        description: 'Exclusão de usuários requer acesso direto ao backend por questões de segurança.',
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      profile: user.profile,
      matricula: user.matricula || '',
      permissions: user.permissions || []
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      profile: 'operador',
      matricula: '',
      permissions: []
    });
    setShowPassword(false);
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a nova senha.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: selectedUser.id,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!',
      });

      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPasswordDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsPasswordDialogOpen(true);
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
          <h1 className="text-3xl font-bold text-foreground">
            {currentUser?.profile === 'mecanico' ? 'Gerenciamento de Contas' : 'Gerenciamento de Usuários'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentUser?.profile === 'mecanico' 
              ? 'Crie e gerencie contas de usuários com permissões personalizadas' 
              : 'Gerencie usuários e seus perfis de acesso'}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {currentUser?.profile === 'mecanico' ? 'Nova Conta' : 'Novo Usuário'}
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
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions && user.permissions.length > 0 ? (
                            user.permissions.slice(0, 2).map(perm => {
                              const permLabel = AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm;
                              return (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {permLabel}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhuma</span>
                          )}
                          {user.permissions && user.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openPasswordDialog(user)}
                            title="Alterar senha"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
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
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input 
                  id="username" 
                  value={formData.username} 
                  onChange={e => setFormData({
                    ...formData,
                    username: e.target.value
                  })} 
                  placeholder="usuario123" 
                />
              </div>
              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
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
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} 
                placeholder="João Silva" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile">Perfil *</Label>
                <Select 
                  value={formData.profile} 
                  onValueChange={(value: any) => setFormData({
                    ...formData,
                    profile: value
                  })}
                >
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
                <Input 
                  id="matricula" 
                  value={formData.matricula} 
                  onChange={e => setFormData({
                    ...formData,
                    matricula: e.target.value
                  })} 
                  placeholder="OP001" 
                />
              </div>
            </div>
            
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" />
                Permissões de Acesso
              </Label>
              <div className="border rounded-md p-3 bg-muted/30 space-y-2 max-h-48 overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`perm-add-${permission.id}`}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, permission.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor={`perm-add-${permission.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selecione as funcionalidades que este usuário poderá acessar
              </p>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" value={formData.username} disabled className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input 
                id="edit-name" 
                value={formData.name} 
                onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} 
                placeholder="João Silva" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-profile">Perfil</Label>
                <Input 
                  id="edit-profile" 
                  value={getProfileBadge(formData.profile).label} 
                  disabled 
                  className="bg-muted" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Não pode ser alterado
                </p>
              </div>
              <div>
                <Label htmlFor="edit-matricula">Matrícula</Label>
                <Input 
                  id="edit-matricula" 
                  value={formData.matricula} 
                  onChange={e => setFormData({
                    ...formData,
                    matricula: e.target.value
                  })} 
                  placeholder="OP001" 
                />
              </div>
            </div>
            
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" />
                Permissões de Acesso
              </Label>
              <div className="border rounded-md p-3 bg-muted/30 space-y-2 max-h-48 overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`perm-edit-${permission.id}`}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, permission.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor={`perm-edit-${permission.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selecione as funcionalidades que este usuário poderá acessar
              </p>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
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
            <AlertDialogAction onClick={handleDeleteUser} disabled={isLoading}>
              {isLoading ? 'Excluindo...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova Senha *</Label>
              <div className="relative">
                <Input 
                  id="new-password" 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
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
              <p className="text-xs text-muted-foreground mt-1">
                A senha deve ter no mínimo 6 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPasswordDialogOpen(false);
              setNewPassword('');
              setShowPassword(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};

export default UserManagement;
