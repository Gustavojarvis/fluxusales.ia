import { supabase } from '@/lib/supabase/client';
import type { Subscription, Plan } from '@/lib/types/database';

// Subscription service — manages plan subscriptions for companies.
// Prepared for future Stripe/payment gateway integration.
export class SubscriptionService {
  static async getByCompany(companyId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Subscription) || null;
  }

  static async create(companyId: string, plan: Plan): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        company_id: companyId,
        plan,
        status: 'active',
        start_date: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Subscription;
  }

  static async updatePlan(companyId: string, plan: Plan): Promise<Subscription> {
    // Try to update existing
    const existing = await this.getByCompany(companyId);
    if (existing) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Subscription;
    }
    // Create if not exists
    return this.create(companyId, plan);
  }

  static async cancel(companyId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled', end_date: new Date().toISOString() })
      .eq('company_id', companyId);
    if (error) throw new Error(error.message);
  }
}
