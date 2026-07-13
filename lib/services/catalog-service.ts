import { supabase } from '@/lib/supabase/client';
import type { Product, Category } from '@/lib/types/database';

// Catalog service — fetches products and categories from the database.
// Never invents products or prices; always queries Supabase.
export class CatalogService {
  static async getProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) throw new Error(`Falha ao buscar produtos: ${error.message}`);
    return (data as Product[]) || [];
  }

  static async getCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw new Error(`Falha ao buscar categorias: ${error.message}`);
    return (data as Category[]) || [];
  }

  static async getProductById(companyId: string, productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', companyId)
      .eq('id', productId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new Error(`Falha ao buscar produto: ${error.message}`);
    return (data as Product) || null;
  }

  // Search products by name (case-insensitive)
  static async searchProducts(companyId: string, query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('is_available', true)
      .ilike('name', `%${query}%`)
      .order('is_featured', { ascending: false })
      .limit(10);

    if (error) throw new Error(`Falha ao buscar produtos: ${error.message}`);
    return (data as Product[]) || [];
  }

  // Get products by category
  static async getProductsByCategory(companyId: string, categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', companyId)
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) throw new Error(`Falha ao buscar produtos: ${error.message}`);
    return (data as Product[]) || [];
  }

  // Get featured products
  static async getFeaturedProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('is_available', true)
      .eq('is_featured', true)
      .order('name')
      .limit(5);

    if (error) throw new Error(`Falha ao buscar destaques: ${error.message}`);
    return (data as Product[]) || [];
  }
}
