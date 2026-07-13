'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, Loader2, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Category } from '@/lib/types/database';

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => void;
};

export function CategoryDialog({ open, onOpenChange, categories, onSaved }: CategoryDialogProps) {
  const { company } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!company || !name.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('categories').insert({
      name: name.trim(),
      company_id: company.id,
    });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar a categoria.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    toast({ title: 'Categoria criada', description: `${name} foi adicionada.` });
    setName('');
    setLoading(false);
    onSaved();
  }

  async function handleDelete() {
    if (!deleteCategory) return;
    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deleteCategory.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a categoria.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Categoria excluída', description: `${deleteCategory.name} foi removida.` });
    setDeleteCategory(null);
    onSaved();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Categorias</DialogTitle>
          </DialogHeader>

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cat-name">Nova categoria</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Hambúrguer, Bebidas..."
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>

          {/* List */}
          <div className="mt-4 space-y-2">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteCategory(cat)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma categoria cadastrada ainda.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteCategory?.name}</strong>?
              Produtos desta categoria não serão excluídos, mas ficarão sem categoria.
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
    </>
  );
}
