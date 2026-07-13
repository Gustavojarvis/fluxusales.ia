'use client';

import { BarChart3, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Card } from '@/components/ui/card';

const monthlyData = [
  { month: 'Jan', revenue: 4200, orders: 120 },
  { month: 'Fev', revenue: 5100, orders: 145 },
  { month: 'Mar', revenue: 6800, orders: 180 },
  { month: 'Abr', revenue: 5900, orders: 165 },
  { month: 'Mai', revenue: 7200, orders: 210 },
  { month: 'Jun', revenue: 8100, orders: 230 },
  { month: 'Jul', revenue: 9500, orders: 275 },
];

function ReportsContent() {
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Análise detalhada do seu negócio" />

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard label="Receita Total" value="R$ 46.800" change="+18% este mês" changeType="positive" icon={DollarSign} />
        <KPICard label="Total de Pedidos" value="1.325" change="+12%" changeType="positive" icon={ShoppingBag} />
        <KPICard label="Crescimento" value="+18%" change="vs mês anterior" changeType="positive" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">Receita mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Receita']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">Volume de pedidos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Relatórios avançados</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Relatórios detalhados por período, produto, categoria e cliente estarão disponíveis em breve.
        </p>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <ReportsContent />
    </DashboardLayout>
  );
}
