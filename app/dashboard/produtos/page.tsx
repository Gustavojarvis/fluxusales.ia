'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Star, Eye, EyeOff, Pencil, Trash2, Package, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/dashboard/product-form';
import { CategoryDialog } from '@/components/dashboard/category-dialog';
import type { Product, Category } from '@/lib/types/database';

const ITEMS_PER_PAGE = 8;

type SortField = 'name' | 'price' | 'recent';
type AvailabilityFilter = 'all' | 'available' | 'unavailable';

function DashboardProducts() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortField, setSortField] = useState<SortField>('recent');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('company_id', company.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  }, [company]);

  const fetchCategories = useCallback(async () => {
    if (!company) return;
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', company.id)
      .is('deleted_at', null)
      .order('name');
    setCategories((data as Category[]) || []);
  }, [company]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Filter + sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category_id === categoryFilter);
    }

    // Availability
    if (availabilityFilter === 'available') {
      result = result.filter((p) => p.is_available);
    } else if (availabilityFilter === 'unavailable') {
      result = result.filter((p) => !p.is_available);
    }

    // Sort
    if (sortField === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortField === 'price') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Featured first
    result.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

    return result;
  }, [products, search, categoryFilter, availabilityFilter, sortField]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, availabilityFilter, sortField]);

  async function toggleAvailable(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar a disponibilidade.', variant: 'destructive' });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p))
    );
    toast({
      title: product.is_available ? 'Produto indisponível' : 'Produto disponível',
      description: `${product.name} ${product.is_available ? 'não aparece mais' : 'agora aparece'} para os clientes.`,
    });
  }

  async function toggleFeatured(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !product.is_featured })
      .eq('id', product.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar o destaque.', variant: 'destructive' });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_featured: !p.is_featured } : p))
    );
    toast({
      title: product.is_featured ? 'Destaque removido' : 'Produto em destaque',
      description: `${product.name} ${product.is_featured ? 'não é mais destaque' : 'agora aparece primeiro'}.`,
    });
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deleteProduct.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o produto.', variant: 'destructive' });
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
    toast({ title: 'Produto excluído', description: `${deleteProduct.name} foi removido com sucesso.` });
    setDeleteProduct(null);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Produtos" description="Gerencie seu cardápio">
        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
          <Filter className="mr-2 h-4 w-4" />
          Categorias
        </Button>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </PageHeader>

      {/* Filters bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, descrição ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Availability filter */}
          <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="unavailable">Indisponíveis</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="price">Preço</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category.name}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={() => toggleAvailable(product)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleFeatured(product)}
                      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          product.is_featured
                            ? 'fill-warning text-warning'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAvailable(product)}
                        title={product.is_available ? 'Tornar indisponível' : 'Tornar disponível'}
                      >
                        {product.is_available ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProduct(product)}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {search || categoryFilter !== 'all' || availabilityFilter !== 'all'
                ? 'Nenhum produto encontrado'
                : 'Nenhum produto cadastrado'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search || categoryFilter !== 'all' || availabilityFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar o que procura.'
                : 'Comece adicionando seu primeiro produto ao cardápio.'}
            </p>
            {!search && categoryFilter === 'all' && availabilityFilter === 'all' && (
              <Button onClick={handleNew} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar produto
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {filteredProducts.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de{' '}
            {filteredProducts.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Product form dialog */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categories}
        onSaved={() => {
          fetchProducts();
          fetchCategories();
        }}
      />

      {/* Category dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        onSaved={() => fetchCategories()}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteProduct?.name}</strong>?
              Esta ação não pode ser desfeita. O produto será removido do cardápio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <DashboardProducts />
    </DashboardLayout>
  );
}
