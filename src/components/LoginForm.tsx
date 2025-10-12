import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import gdlLogo from '@/assets/gdl-logo.png';
import forkliftIcon from '@/assets/forklift-icon.png';
export const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    setIsLoading(true);
    try {
      const email = `${username}@gdl.com`;

      // Try to sign in
      const {
        data: signInData,
        error: signInError
      } = await supabase.auth.signInWithPassword({
        email,
        password: password
      });
      if (signInError) {
        // If user doesn't exist and it's a demo user, create it
        const demoUser = demoUsers.find(u => u.username === username);
        if (demoUser && password === '123456') {
          const {
            error: signUpError
          } = await supabase.auth.signUp({
            email,
            password: password,
            options: {
              data: {
                username: demoUser.username,
                name: demoUser.name,
                profile: demoUser.profile
              }
            }
          });
          if (signUpError) {
            setError('Erro ao criar usuário de demonstração');
            toast({
              title: "Erro",
              description: "Não foi possível criar o usuário.",
              variant: "destructive"
            });
          } else {
            // Try to sign in again
            const {
              error: retryError
            } = await supabase.auth.signInWithPassword({
              email,
              password: password
            });
            if (retryError) {
              setError('Usuário criado. Tente fazer login novamente.');
            } else {
              toast({
                title: "Login realizado",
                description: "Bem-vindo ao sistema!"
              });
            }
          }
        } else {
          setError('Usuário ou senha incorretos');
          toast({
            title: "Erro no login",
            description: "Verifique suas credenciais e tente novamente.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema!"
        });
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const demoUsers = [{
    username: 'operador1',
    profile: 'operador',
    name: 'João Silva'
  }, {
    username: 'mecanico1',
    profile: 'mecanico',
    name: 'Carlos Oliveira'
  }];
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <img src={forkliftIcon} alt="Empilhadeira" className="w-8 h-8 object-contain" />
              <h1 className="text-2xl font-bold text-foreground">GDL CheckList</h1>
            </div>
            <p className="text-muted-foreground">Sistema de Checklist Digital</p>
            <p className="text-sm text-muted-foreground">Solução em movimento</p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src={gdlLogo} alt="GDL - Solução em movimento" className="w-40 h-10 object-contain opacity-100 " />
              
            </div>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="username" type="text" placeholder="Digite seu usuário" value={username} onChange={e => setUsername(e.target.value)} className="pl-10" disabled={isLoading} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" disabled={isLoading} />
                </div>
              </div>

              {error && <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Users */}
        
      </div>
    </div>;
};