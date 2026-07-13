'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle2, ChefHat, Bell, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types/database';

const COLUMNS: { status: OrderStatus; title: string; icon: typeof Clock; color: string }[] = [
  { status: 'pending', title: 'Novos', icon: Clock, color: 'text-warning' },
  { status: 'preparing', title: 'Preparando', icon: ChefHat, color: 'text-primary' },
  { status: 'ready', title: 'Prontos', icon: CheckCircle2, color: 'text-success' },
];

function KitchenContent() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!company) return;
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('company_id', company.id)
      .is('deleted_at', null)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [company]);

  const handleNewOrder = useCallback((order: Order) => {
    setNewOrderIds((prev) => new Set(prev).add(order.id));
    toast({ title: 'Novo pedido!', description: `Pedido #${order.order_number || order.id.slice(0, 8)}` });
    fetchOrders();
    setTimeout(() => {
      setNewOrderIds((prev) => { const n = new Set(prev); n.delete(order.id); return n; });
    }, 10000);
  }, [toast, fetchOrders]);

  useOrderNotifications(company?.id, { soundEnabled, onNewOrder: handleNewOrder });

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function advanceStatus(order: Order) {
    const flow: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];
    const currentIdx = flow.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= flow.length - 1) return;
    const nextStatus = flow[currentIdx + 1];
    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
    if (error) { toast({ title: 'Erro', variant: 'destructive' }); return; }
    setOrders((prev) => prev.filter((o) => o.id !== order.id || nextStatus !== 'completed'));
    if (nextStatus === 'completed') {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o));
    }
    toast({ title: 'Status atualizado', description: `Pedido #${order.order_number} → ${nextStatus}` });
  }

  async function moveBack(order: Order) {
    const flow: OrderStatus[] = ['pending', 'preparing', 'ready'];
    const idx = flow.indexOf(order.status);
    if (idx <= 0) return;
    const prevStatus = flow[idx - 1];
    await supabase.from('orders').update({ status: prevStatus }).eq('id', order.id);
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: prevStatus } : o));
  }

  function formatTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cozinha" description="Acompanhe os pedidos em tempo real">
        <Button
          variant={soundEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSoundEnabled((v) => !v)}
        >
          <Bell className={cn('mr-2 h-4 w-4', !soundEnabled && 'opacity-50')} />
          {soundEnabled ? 'Som ativo' : 'Som mudo'}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <col.icon className={cn('h-5 w-5', col.color)} />
                  <h3 className="font-semibold">{col.title}</h3>
                  <Badge variant="secondary" className="ml-auto">{colOrders.length}</Badge>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {colOrders.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                      Nenhum pedido
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <Card
                        key={order.id}
                        className={cn(
                          'p-4 transition-all',
                          newOrderIds.has(order.id) && 'border-primary bg-primary/5 animate-pulse-soft'
                        )}
                      >
                        {newOrderIds.has(order.id) && (
                          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-primary">
                            <Bell className="h-3 w-3" /> Novo pedido
                          </div>
                        )}

                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold">#{order.order_number || order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer_name || order.customer?.name || 'Cliente'}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
                        </div>

                        <div className="mt-3 space-y-1">
                          {(order.items || []).map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <p className="mt-2 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            Obs: {order.notes}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {order.delivery_method === 'pickup' ? 'Retirada' : 'Entrega'}
                          </div>
                          <div className="flex gap-1">
                            {col.status !== 'pending' && (
                              <Button size="sm" variant="ghost" onClick={() => moveBack(order)}>
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="default" onClick={() => advanceStatus(order)}>
                              {col.status === 'ready' ? 'Finalizar' : 'Avançar'}
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() {
  return (
    <DashboardLayout>
      <KitchenContent />
    </DashboardLayout>
  );
}
