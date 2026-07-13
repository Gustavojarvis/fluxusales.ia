'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/lib/types/database';

// useRealtimeOrders — subscribes to Supabase Realtime for new orders.
// When a new order is inserted, it triggers a callback (for notifications/sound)
// and refreshes the order list automatically.
export function useRealtimeOrders(companyId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!companyId) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return;

    const orderList = (data as Order[]) || [];

    // On first load, mark all as known (no notification)
    if (isFirstLoad.current) {
      orderList.forEach((o) => knownOrderIds.current.add(o.id));
      isFirstLoad.current = false;
    } else {
      // Detect new orders
      const newOnes = orderList.filter((o) => !knownOrderIds.current.has(o.id));
      if (newOnes.length > 0) {
        newOnes.forEach((o) => {
          knownOrderIds.current.add(o.id);
          setNewOrderIds((prev) => new Set(prev).add(o.id));
        });
      }
    }

    setOrders(orderList);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;

    fetchOrders();

    // Subscribe to real-time inserts on the orders table
    const channel = supabase
      .channel(`orders:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchOrders]);

  // Clear "new" highlight after 10 seconds
  const clearNewHighlight = useCallback((orderId: string) => {
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }, []);

  return {
    orders,
    loading,
    newOrderIds,
    clearNewHighlight,
    refresh: fetchOrders,
  };
}
