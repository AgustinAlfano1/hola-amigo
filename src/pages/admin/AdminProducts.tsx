import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Product = Tables<'products'>;

const emptyProduct = {
  name: '',
  description: '',
  brand: '',
  category: '',
  price: 0,
  original_price: null as number | null,
  image_url: '',
  in_stock: true,
  is_new: false,
  is_featured: false,
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      brand: p.brand || '',
      category: p.category || '',
      price: p.price,
      original_price: p.original_price,
      image_url: p.image_url || '',
      in_stock: p.in_stock,
      is_new: p.is_new,
      is_featured: p.is_featured,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) {
      toast({ title: 'Error', description: 'Nombre y precio son obligatorios.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('products').update(form).eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Producto actualizado' });
    } else {
      const { error } = await supabase.from('products').insert(form);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Producto creado' });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Producto eliminado' }); fetchProducts(); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Productos</h2>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Precio</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">${p.price.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${p.in_stock ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No hay productos cargados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <label className="font-body text-sm text-muted-foreground">Nombre *</label>
              <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-sm text-muted-foreground">Marca</label>
                <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground">Categoría</label>
                <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-sm text-muted-foreground">Precio *</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground">Precio original</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.original_price || ''} onChange={(e) => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground">Descripción</label>
              <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground">URL de imagen</label>
              <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="rounded border-input" /> En stock
              </label>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="rounded border-input" /> Nuevo
              </label>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded border-input" /> Destacado
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 font-body text-sm hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-4 py-2 font-body text-sm text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
