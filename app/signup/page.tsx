'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, ArrowLeft, Loader2, Mail, Lock, User, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { CompanyService } from '@/lib/services/company-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Plan } from '@/lib/types/database';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshCompany } = useAuth();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const plan = (searchParams.get('plan') as Plan) || 'starter';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // 1. Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company_name: companyName } },
    });

    if (authError) {
      toast({
        title: 'Erro ao criar conta',
        description: authError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // 2. Create company record with slug
    if (authData.user) {
      const slug = await CompanyService.generateSlug(companyName);
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName, user_id: authData.user.id, plan, slug })
        .select('id')
        .single();

      if (companyError) {
        toast({
          title: 'Aviso',
          description: 'Conta criada, mas houve um problema ao configurar sua empresa.',
          variant: 'destructive',
        });
      } else if (companyData) {
        // 3. Create default company settings
        await supabase.from('company_settings').insert({
          company_id: companyData.id,
          company_name: companyName,
          welcome_message: `Olá! Bem-vindo(a) à ${companyName}! 👋\n\nSou seu assistente virtual. Posso te ajudar a fazer um pedido. Quer ver nosso cardápio?`,
          brand_color: '#0ea5e9',
        });

        // 4. Create subscription
        await supabase.from('subscriptions').insert({
          company_id: companyData.id,
          plan,
          status: 'active',
          start_date: new Date().toISOString(),
        });

        // 5. Create app_user record
        await supabase.from('app_users').insert({
          company_id: companyData.id,
          auth_user_id: authData.user.id,
          name,
          email,
          role: 'admin',
        });
      }
    }

    await refreshCompany();
    toast({
      title: 'Conta criada!',
      description: 'Bem-vindo ao FluxSales AI. Seu painel está pronto.',
    });
    router.push('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
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

          <h1 className="text-center text-2xl font-bold">Criar Conta</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Comece a vender com IA em minutos
          </p>

          {/* Plan badge */}
          <div className="mt-4 flex justify-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Plano: {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Nome da empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Burger House"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta grátis'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
