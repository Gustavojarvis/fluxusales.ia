import { supabase } from '@/lib/supabase/client';
import type { Customer } from '@/lib/types/database';

// Customer service — manages customer records with auto-creation from orders
export class CustomerService {
  static async listByCompany(companyId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Customer[]) || [];
  }

  static async findByPhone(companyId: string, phone: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Customer) || null;
  }

  // Upsert customer by phone — creates if not exists, updates name if changed
  static async upsertByPhone(companyId: string, name: string, phone: string): Promise<Customer> {
    const { data, error } = await supabase
      .rpc('upsert_customer', { p_company_id: companyId, p_name: name, p_phone: phone });
    if (error) throw new Error(error.message);
    // Fetch the full record
    const customer = await this.findByPhone(companyId, phone);
    return customer!;
  }

  static async getById(companyId: string, id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Customer) || null;
  }
}
