'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ChatWidget } from '@/components/chat/chat-widget';
import { ProductCard } from '@/components/storefront/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Star, Package } from 'lucide-react';
import type { Company, Product, Category } from '@/lib/types/database';

export default function StorefrontPage({ params }: { params: { id: string } }) {
  const companyId = params.id;
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .is('deleted_at', null)
          .maybeSingle();

        if (companyError || !companyData) {
          setError('Loja não encontrada.');
          setLoading(false);
          return;
        }

        setCompany(companyData as Company);

        // Fetch products and categories
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .eq('is_available', true)
            .order('is_featured', { ascending: false })
            .order('name'),
          supabase
            .from('categories')
            .select('*')
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('name'),
        ]);

        setProducts((productsRes.data as Product[]) || []);
        setCategories((categoriesRes.data as Category[]) || []);
      } catch {
        setError('Erro ao carregar a loja.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="border-b border-border bg-card px-4 py-4">
          <div className="mx-auto flex max-w-5xl items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Loja não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          {error || 'A loja que você procura não existe ou foi desativada.'}
        </p>
      </div>
    );
  }

  // Group products by category
  const featured = products.filter((p) => p.is_featured);
  const byCategory = categories.map((cat) => ({
    category: cat,
    items: products.filter((p) => p.category_id === cat.id),
  })).filter((group) => group.items.length > 0);
  const uncategorized = products.filter((p) => !p.category_id);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt={company.name} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="text-base font-semibold">{company.name}</h1>
              <p className="text-xs text-muted-foreground">Atendimento com IA · 24h</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
            Aberto agora
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24">
        {/* Hero banner */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Bem-vindo(a) à {company.name}!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Faça seu pedido pelo chat com nossa IA. Atendimento rápido, 24 horas por dia.
          </p>
        </div>

        {/* Featured products */}
        {featured.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-semibold">Destaques</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Products by category */}
        {byCategory.map(({ category, items }) => (
          <section key={category.id} className="mb-8">
            <h3 className="mb-4 text-lg font-semibold">{category.name}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-4 text-lg font-semibold">Outros</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uncategorized.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Cardápio vazio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No momento não há produtos disponíveis. Volte em breve!
            </p>
          </div>
        )}
      </main>

      {/* Chat widget */}
      <ChatWidget companyId={company.id} companyName={company.name} />
    </div>
  );
}
