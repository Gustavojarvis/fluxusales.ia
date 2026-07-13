'use client';

import { Bot, Sparkles, MessageSquare, Zap, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function IAContent() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inteligência Artificial" description="Configure o comportamento da sua IA de vendas" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Status da IA</h3>
            <Badge className="ml-auto bg-success/10 text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
              Ativa
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">Atendimento automático</Label>
                <p className="text-xs text-muted-foreground">A IA atende clientes automaticamente</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">Sugestão de produtos</Label>
                <p className="text-xs text-muted-foreground">A IA sugere produtos com base no pedido</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">Upsell automático</Label>
                <p className="text-xs text-muted-foreground">Sugerir combos e adicionais</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">Modo de fala formal</Label>
                <p className="text-xs text-muted-foreground">Usar linguagem mais formal com clientes</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">Estatísticas da IA</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Conversas hoje</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">0s</p>
                <p className="text-xs text-muted-foreground">Tempo médio de resposta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-muted-foreground">Disponibilidade</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Personalidade da IA</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Em breve você poderá personalizar o tom de voz, as saudações e as respostas automáticas da sua IA.
        </p>
      </Card>
    </div>
  );
}

export default function IAPage() {
  return (
    <DashboardLayout>
      <IAContent />
    </DashboardLayout>
  );
}
