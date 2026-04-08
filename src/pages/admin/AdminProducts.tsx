import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
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
  stock_quantity: 0,
  codigo: '',
  in_stock: true,
  is_new: false,
  is_featured: false,
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchProducts = async (searchTerm?: string) => {
    setLoading(true);
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`name.ilike.%${searchTerm.trim()}%,brand.ilike.%${searchTerm.trim()}%`);
    }
    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchProducts(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setImagePreview(null);
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
      stock_quantity: p.stock_quantity ?? 0,
      codigo: p.codigo || '',
      in_stock: p.in_stock,
      is_new: p.is_new,
      is_featured: p.is_featured,
    });
    setImagePreview(p.image_url || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Solo se permiten archivos de imagen.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    setForm({ ...form, image_url: urlData.publicUrl });
    setImagePreview(urlData.publicUrl);
    setUploading(false);
    toast({ title: 'Imagen subida correctamente' });
  };

  const removeImage = () => {
    setForm({ ...form, image_url: '' });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) {
      toast({ title: 'Error', description: 'Nombre y precio son obligatorios.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const saveData = {
      ...form,
      in_stock: form.stock_quantity > 0,
    };
    if (editing) {
      const { error } = await supabase.from('products').update(saveData).eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Producto actualizado' });
    } else {
      const { error } = await supabase.from('products').insert(saveData);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Producto creado' });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchProducts(search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Producto eliminado' }); fetchProducts(search); }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">Productos</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
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
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.codigo || '—'}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">${p.price.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-body text-sm font-medium ${p.stock_quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {p.stock_quantity}
                    </span>
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
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No se encontraron productos</td></tr>
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
            <div>
              <label className="font-body text-sm text-muted-foreground">Código (alfanumérico, máx 50 caracteres)</label>
              <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" maxLength={50} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: FLT-001-UNO" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-body text-sm text-muted-foreground">Precio *</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground">Precio original</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.original_price || ''} onChange={(e) => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground">Stock (cantidad)</label>
                <input type="number" min="0" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground">Descripción</label>
              <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Image upload section */}
            <div>
              <label className="font-body text-sm text-muted-foreground">Imagen del producto</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="mt-1 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 font-body text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                </button>
              )}
            </div>

            <div className="flex gap-4">
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
