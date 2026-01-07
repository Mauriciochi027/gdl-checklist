import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import gdlLogo from '@/assets/gdl-logo.png';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';

// Validação de username no formato nome.sobrenome
const usernameSchema = z.string()
  .min(3, 'Usuário deve ter pelo menos 3 caracteres')
  .max(50, 'Usuário deve ter no máximo 50 caracteres')
  .regex(
    /^[a-zA-Z]+\.[a-zA-Z]+$/,
    'Usuário deve estar no formato nome.sobrenome (ex: joao.silva)'
  )
  .transform(val => val.toLowerCase());

const passwordSchema = z.string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha muito longa');

const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras');

export const LoginForm = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupMatricula, setSignupMatricula] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema!"
        });
      } else {
        setError('Usuário ou senha incorretos');
        toast({
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Login error:', err);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Validar username
    const usernameResult = usernameSchema.safeParse(signupUsername);
    if (!usernameResult.success) {
      setSignupError(usernameResult.error.errors[0].message);
      return;
    }

    // Validar nome
    const nameResult = nameSchema.safeParse(signupName);
    if (!nameResult.success) {
      setSignupError(nameResult.error.errors[0].message);
      return;
    }

    // Validar senha
    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) {
      setSignupError(passwordResult.error.errors[0].message);
      return;
    }

    // Validar matrícula
    if (!signupMatricula.trim()) {
      setSignupError('Matrícula é obrigatória');
      return;
    }

    // Validar confirmação de senha
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('As senhas não coincidem');
      return;
    }

    setIsSignupLoading(true);
    try {
      const success = await signup(
        usernameResult.data,
        signupPassword,
        signupName.trim(),
        'operador', // Apenas operadores podem se cadastrar diretamente
        signupMatricula.trim() || undefined
      );

      if (success) {
        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso. Você já está logado."
        });
        // Limpar formulário
        setSignupUsername('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setSignupName('');
        setSignupMatricula('');
      } else {
        setSignupError('Erro ao criar conta. O usuário pode já existir.');
        toast({
          title: "Erro no cadastro",
          description: "Verifique os dados e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Signup error:', err);
      setSignupError('Erro ao criar conta. Tente novamente.');
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a conta.",
        variant: "destructive"
      });
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src={gdlLogo} 
                alt="GDL - Solução em movimento" 
                className="w-100 h-20 object-contain opacity-100" 
              />
            </div>
            <CardDescription className="text-center">
              Sistema de Controle de Equipamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="username" 
                        type="text" 
                        placeholder="Digite seu usuário" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="pl-10" 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Digite sua senha" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="pl-10" 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full bg-slate-600 hover:bg-slate-500">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signup-name" 
                        type="text" 
                        placeholder="Ex: João da Silva" 
                        value={signupName} 
                        onChange={e => setSignupName(e.target.value)} 
                        className="pl-10" 
                        disabled={isSignupLoading}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-username">
                      Usuário <span className="text-xs text-muted-foreground">(nome.sobrenome)</span>
                    </Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signup-username" 
                        type="text" 
                        placeholder="Ex: joao.silva" 
                        value={signupUsername} 
                        onChange={e => setSignupUsername(e.target.value.toLowerCase())} 
                        className="pl-10" 
                        disabled={isSignupLoading}
                        maxLength={50}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use o formato nome.sobrenome (letras apenas)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-matricula">Matrícula *</Label>
                    <Input 
                      id="signup-matricula" 
                      type="text" 
                      placeholder="Digite sua matrícula" 
                      value={signupMatricula} 
                      onChange={e => setSignupMatricula(e.target.value)} 
                      disabled={isSignupLoading}
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signup-password" 
                        type="password" 
                        placeholder="Mínimo 6 caracteres" 
                        value={signupPassword} 
                        onChange={e => setSignupPassword(e.target.value)} 
                        className="pl-10" 
                        disabled={isSignupLoading}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signup-confirm-password" 
                        type="password" 
                        placeholder="Digite a senha novamente" 
                        value={signupConfirmPassword} 
                        onChange={e => setSignupConfirmPassword(e.target.value)} 
                        className="pl-10" 
                        disabled={isSignupLoading}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <Alert className="bg-muted/50 border-muted">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-muted-foreground text-xs">
                      O cadastro direto é permitido apenas para operadores. 
                      Para outros perfis, contate o administrador.
                    </AlertDescription>
                  </Alert>

                  {signupError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signupError}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isSignupLoading} 
                    className="w-full bg-slate-600 hover:bg-slate-500"
                  >
                    {isSignupLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : 'Cadastrar como Operador'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
