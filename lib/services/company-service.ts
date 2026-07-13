import { supabase } from '@/lib/supabase/client';
import type { Company, CompanySettings } from '@/lib/types/database';

// Company service — manages company profile and settings
export class CompanyService {
  static async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Company) || null;
  }

  static async getBySlug(slug: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Company) || null;
  }

  static async update(id: string, updates: Partial<Company>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Company;
  }

  static async getSettings(companyId: string): Promise<CompanySettings | null> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as CompanySettings) || null;
  }

  static async upsertSettings(companyId: string, settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({ company_id: companyId, ...settings })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as CompanySettings;
  }

  static async generateSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return base || 'empresa';
  }
}
