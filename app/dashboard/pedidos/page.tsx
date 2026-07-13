'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Clock, CheckCircle2, XCircle, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order, OrderStatus } from '@/lib/types/database';

const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  preparing: { label: 'Preparando', variant: 'default' },
  ready: { label: 'Pronto', variant: 'default' },
  completed: { label: 'Finalizado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

function OrdersContent() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  const handleNewOrder = useCallback((order: Order) => {
    setNewOrderIds((prev) => new Set(prev).add(order.id));
    toast({
      title: 'Novo pedido!',
      description: `Pedido #${order.order_number || order.id.slice(0, 8)} — R$ ${Number(order.total).toFixed(2)}`,
    });
    fetchOrders();
    setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }, 10000);
  }, [toast]);

  useOrderNotifications(company?.id, { soundEnabled, onNewOrder: handleNewOrder });

  useEffect(() => {
    fetchOrders();
  }, [company]);

  async function fetchOrders() {
    if (!company) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('company_id', company.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  async function updateStatus(order: Order, newStatus: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );
    toast({ title: 'Status atualizado', description: `Pedido agora está: ${STATUS_LABELS[newStatus].label}` });
  }

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const counts = {
    pending: orders.filter((o) => o.status === 'pending').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" description="Acompanhe e gerencie todos os pedidos">
        <Button
          variant={soundEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSoundEnabled((v) => !v)}
        >
          <Bell className={`mr-2 h-4 w-4 ${soundEnabled ? '' : 'opacity-50'}`} />
          {soundEnabled ? 'Som ativo' : 'Som mudo'}
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard label="Pendentes" value={counts.pending} icon={Clock} loading={loading} />
        <KPICard label="Finalizados" value={counts.completed} icon={CheckCircle2} loading={loading} />
        <KPICard label="Cancelados" value={counts.cancelled} icon={XCircle} loading={loading} />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Todos os pedidos</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_FLOW.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Alterar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
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
                  <TableCell className="text-sm text-muted-foreground">
                    {Array.isArray(order.items) ? `${order.items.length} itens` : '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_LABELS[order.status]?.variant || 'outline'}>
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus(order, v as OrderStatus)}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum pedido</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Os pedidos criados pela IA aparecerão aqui automaticamente.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersContent />
    </DashboardLayout>
  );
}
