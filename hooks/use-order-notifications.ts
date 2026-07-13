'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/lib/types/database';

// useOrderNotifications — listens for new orders via Supabase Realtime
// and triggers a notification sound + toast. Configurable sound on/off.
export function useOrderNotifications(
  companyId: string | undefined,
  options: { soundEnabled: boolean; onNewOrder?: (order: Order) => void }
) {
  const { soundEnabled, onNewOrder } = options;
  const soundRef = useRef(soundEnabled);
  const callbackRef = useRef(onNewOrder);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    callbackRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    if (!companyId) return;

    let knownIds = new Set<string>();

    // Mark existing orders as known
    supabase
      .from('orders')
      .select('id')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .then(({ data }) => {
        if (data) {
          data.forEach((o) => knownIds.add(o.id));
        }
      });

    const channel = supabase
      .channel(`notifications:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          if (!knownIds.has(newOrder.id)) {
            knownIds.add(newOrder.id);

            // Play notification sound
            if (soundRef.current) {
              playNotificationSound();
            }

            // Trigger callback
            callbackRef.current?.(newOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);
}

// Play a simple notification beep using the Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Audio not available — silently ignore
  }
}
