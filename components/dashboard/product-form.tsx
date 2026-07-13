'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Loader2, Upload, X, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Product, Category, ProductInput } from '@/lib/types/database';

type ProductFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSaved: () => void;
};

export function ProductForm({ open, onOpenChange, product, categories, onSaved }: ProductFormProps) {
  const { company } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sku, setSku] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when product changes
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(String(product.price));
      setCategoryId(product.category_id || '');
      setImageUrl(product.image_url || '');
      setIsAvailable(product.is_available);
      setIsFeatured(product.is_featured);
      setSku(product.sku || '');
      setPrepTime(product.prep_time || '');
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId('');
      setImageUrl('');
      setIsAvailable(true);
      setIsFeatured(false);
      setSku('');
      setPrepTime('');
    }
    setErrors({});
  }, [product, open]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!price.trim()) newErrors.price = 'Preço é obrigatório';
    else if (isNaN(Number(price.replace(',', '.'))) || Number(price.replace(',', '.')) < 0)
      newErrors.price = 'Preço inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleImageUpload(file: File) {
    if (!company) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    if (!validate()) return;

    setLoading(true);

    const payload: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price.replace(',', '.')),
      category_id: categoryId || null,
      image_url: imageUrl || null,
      is_available: isAvailable,
      is_featured: isFeatured,
      sku: sku.trim(),
      prep_time: prepTime.trim(),
    };

    if (product) {
      // Update
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id);

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível atualizar o produto.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({ title: 'Produto atualizado', description: `${name} foi atualizado com sucesso.` });
    } else {
      // Create
      const { error } = await supabase
        .from('products')
        .insert({ ...payload, company_id: company.id });

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível criar o produto.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({ title: 'Produto criado', description: `${name} foi adicionado ao cardápio.` });
    }

    setLoading(false);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload + preview */}
          <div className="space-y-2">
            <Label>Imagem do produto</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-muted">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Ou cole uma URL de imagem abaixo
                </p>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bacon Burger"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hambúrguer artesanal com bacon crocante..."
              rows={3}
            />
          </div>

          {/* Price + Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Preço *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="24,90"
                  className="pl-9"
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SKU + Prep time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (opcional)</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BB-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepTime">Tempo de preparo (opcional)</Label>
              <Input
                id="prepTime"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15 min"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="available" className="cursor-pointer">
                Disponível para venda
              </Label>
              <p className="text-xs text-muted-foreground">
                Produtos indisponíveis não aparecem para os clientes
              </p>
            </div>
            <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="featured" className="flex cursor-pointer items-center gap-1">
                Produto em destaque
                <Star className="h-3.5 w-3.5 text-warning" />
              </Label>
              <p className="text-xs text-muted-foreground">
                Destaques aparecem primeiro para os clientes
              </p>
            </div>
            <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
