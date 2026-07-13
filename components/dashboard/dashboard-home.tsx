'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Receipt,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  Package,
  Bell,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { useToast } from '@/hooks/use-toast';
import { KPICard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order } from '@/lib/types/database';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  preparing: { label: 'Preparando', variant: 'default' },
  ready: { label: 'Pronto', variant: 'default' },
  completed: { label: 'Finalizado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Generate last 7 days labels
function getLast7Days() {
  const days: { day: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    days.push({ day: label, revenue: 0, orders: 0 });
  }
  return days;
}

export function DashboardHome() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    revenueToday: 0,
    ordersToday: 0,
    avgTicket: 0,
    pending: 0,
    completed: 0,
    newCustomers: 0,
    topProducts: [] as { name: string; quantity: number }[],
    conversationsStarted: 0,
    conversionRate: 0,
  });
  const [chartData, setChartData] = useState(getLast7Days());
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  // Real-time notification callback
  const handleNewOrder = useCallback((order: Order) => {
    setNewOrderIds((prev) => new Set(prev).add(order.id));
    toast({
      title: 'Novo pedido!',
      description: `Pedido #${order.order_number || order.id.slice(0, 8)} — R$ ${Number(order.total).toFixed(2)}`,
    });
    // Auto-refresh data
    if (company) fetchData();
    // Clear highlight after 10 seconds
    setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }, 10000);
  }, [company, toast]);

  useOrderNotifications(company?.id, { soundEnabled, onNewOrder: handleNewOrder });

  useEffect(() => {
    if (!company) return;
    fetchData();
  }, [company]);

  async function fetchData() {
    if (!company) return;
    setLoading(true);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();

    // Fetch orders
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('company_id', company.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const orderList = (allOrders as Order[]) || [];
    setOrders(orderList.slice(0, 8));

    // Today's orders
    const todayOrders = orderList.filter(
      (o) => new Date(o.created_at) >= new Date(todayStart)
    );
    const revenueToday = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0);
    const completedToday = todayOrders.filter((o) => o.status === 'completed').length;
    const pendingToday = todayOrders.filter((o) => o.status === 'pending').length;
    const avgTicket = todayOrders.length > 0 ? revenueToday / todayOrders.length : 0;

    // Last 7 days chart
    const days = getLast7Days();
    orderList.forEach((o) => {
      const orderDate = new Date(o.created_at);
      if (orderDate >= new Date(sevenDaysAgo)) {
        const dayLabel = orderDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayEntry = days.find((d) => d.day === dayLabel);
        if (dayEntry) {
          if (o.status !== 'cancelled') {
            dayEntry.revenue += Number(o.total);
          }
          dayEntry.orders += 1;
        }
      }
    });
    setChartData(days);

    // Top products from order items
    const productCount: Record<string, number> = {};
    orderList.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          productCount[item.name] = (productCount[item.name] || 0) + (item.quantity || 1);
        });
      }
    });
    const topProducts = Object.entries(productCount)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    setStats((prev) => ({ ...prev, topProducts }));

    // Category distribution (from products)
    const { data: products } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', company.id)
      .is('deleted_at', null);

    const catCount: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      const catName = p.category?.name || 'Sem categoria';
      catCount[catName] = (catCount[catName] || 0) + 1;
    });
    setCategoryData(Object.entries(catCount).map(([name, value]) => ({ name, value })));

    // New customers (last 7 days)
    const { count: newCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .is('deleted_at', null)
      .gte('created_at', sevenDaysAgo);

    // Count conversations started today
    let conversationsStarted = 0;
    try {
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', todayStart);
      conversationsStarted = convCount || 0;
    } catch {
      // Non-fatal
    }

    const conversionRate = conversationsStarted > 0
      ? Math.round((todayOrders.length / conversationsStarted) * 100)
      : 0;

    setStats({
      revenueToday,
      ordersToday: todayOrders.length,
      avgTicket,
      pending: pendingToday,
      completed: completedToday,
      newCustomers: newCustomers || 0,
      topProducts,
      conversationsStarted,
      conversionRate,
    });
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={company ? `Visão geral de ${company.name}` : 'Visão geral do seu negócio'}
      >
        <Button
          variant={soundEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSoundEnabled((v) => !v)}
          title={soundEnabled ? 'Som de notificação ativo' : 'Som de notificação desativado'}
        >
          <Bell className={`mr-2 h-4 w-4 ${soundEnabled ? '' : 'opacity-50'}`} />
          {soundEnabled ? 'Som ativo' : 'Som mudo'}
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Receita do Dia"
          value={stats.revenueToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          change="+12% vs ontem"
          changeType="positive"
          icon={DollarSign}
          loading={loading}
        />
        <KPICard
          label="Pedidos Hoje"
          value={stats.ordersToday}
          change="+8% vs ontem"
          changeType="positive"
          icon={ShoppingBag}
          loading={loading}
        />
        <KPICard
          label="Ticket Médio"
          value={stats.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          change="+3%"
          changeType="positive"
          icon={Receipt}
          loading={loading}
        />
        <KPICard
          label="Clientes Novos"
          value={stats.newCustomers}
          change="Últimos 7 dias"
          changeType="neutral"
          icon={Users}
          loading={loading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Pedidos Pendentes"
          value={stats.pending}
          icon={Clock}
          loading={loading}
        />
        <KPICard
          label="Pedidos Finalizados"
          value={stats.completed}
          icon={CheckCircle2}
          loading={loading}
        />
        <KPICard
          label="Conversas Iniciadas"
          value={stats.conversationsStarted}
          change="Hoje"
          changeType="neutral"
          icon={MessageSquare}
          loading={loading}
        />
        <KPICard
          label="Taxa de Conversão"
          value={`${stats.conversionRate}%`}
          change={stats.conversionRate >= 30 ? 'Boa' : 'Melhorável'}
          changeType={stats.conversionRate >= 30 ? 'positive' : 'neutral'}
          icon={TrendingUp}
          loading={loading}
        />
        <KPICard
          label="Produtos Cadastrados"
          value={stats.topProducts.length > 0 ? 'Ver em Produtos' : '0'}
          icon={Package}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Receita dos últimos 7 dias</h3>
              <p className="text-sm text-muted-foreground">Acompanhe a evolução das vendas</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Receita']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card className="p-5">
          <h3 className="text-base font-semibold">Produtos por categoria</h3>
          <p className="text-sm text-muted-foreground">Distribuição do cardápio</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.name}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Nenhuma categoria cadastrada
            </div>
          )}
        </Card>
      </div>

      {/* Top products + Recent orders */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top products bar */}
        <Card className="p-5">
          <h3 className="text-base font-semibold">Produtos mais vendidos</h3>
          <p className="text-sm text-muted-foreground">Top 5 do período</p>
          {stats.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="quantity" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Sem dados de vendas ainda
            </div>
          )}
        </Card>

        {/* Recent orders */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-base font-semibold">Últimos pedidos</h3>
          <p className="mb-4 text-sm text-muted-foreground">Pedidos mais recentes</p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-shimmer rounded-lg" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={newOrderIds.has(order.id) ? 'bg-primary/5 animate-pulse-soft' : ''}
                  >
                    <TableCell className="font-medium">
                      #{order.order_number || order.id.slice(0, 8)}
                      {newOrderIds.has(order.id) && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary">
                          <Bell className="h-3 w-3" /> Novo
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{order.customer_name || order.customer?.name || 'Cliente'}</TableCell>
                    <TableCell>
                      {Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABELS[order.status]?.variant || 'outline'}>
                        {STATUS_LABELS[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Nenhum pedido ainda. Os pedidos aparecerão aqui automaticamente.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
