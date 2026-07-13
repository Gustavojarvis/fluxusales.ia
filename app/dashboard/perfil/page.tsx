'use client';

import { useState, FormEvent } from 'react';
import { Loader2, User, Mail, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

function ProfileContent() {
  const { user, company } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { name },
    });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o perfil.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' });
    setLoading(false);
  }

  const initials = (name || email || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Gerencie suas informações pessoais" />

      <Card className="max-w-2xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{name || 'Usuário'}</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
            {company && (
              <p className="text-xs text-muted-foreground">{company.name} · {company.plan}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                value={email}
                disabled
                className="pl-9 opacity-60"
              />
            </div>
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileContent />
    </DashboardLayout>
  );
}
