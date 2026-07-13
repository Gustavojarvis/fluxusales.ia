'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshCompany } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'E-mail ou senha incorretos. Verifique e tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    await refreshCompany();
    toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });
    router.push('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="absolute left-1/2 top-1/3 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="absolute -top-12 left-0 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o site
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold">
              FluxSales <span className="text-primary">AI</span>
            </span>
          </div>

          <h1 className="text-center text-2xl font-bold">Entrar</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Acesse seu painel de vendas
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
