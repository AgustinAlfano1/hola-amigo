import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Pencil, Trash2, Search, Upload, X, Download, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Product = Tables<'products'>;

const emptyProduct = {
  name: '', description: '', brand: '', category: '',
  price: 0, original_price: null as number | null,
  image_url: '', stock_quantity: 0, codigo: '',
  in_stock: true, is_new: false, is_featured: false,
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchProducts = async (searchTerm?: string, field?: string) => {
    setLoading(true);
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    const term = searchTerm?.trim();
    const f = field || searchField;
    if (term) {
      if (f === 'all') {
        query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%,codigo.ilike.%${term}%,description.ilike.%${term}%`);
      } else if (f === 'name') {
        query = query.ilike('name', `%${term}%`);
      } else if (f === 'brand') {
        query = query.ilike('brand', `%${term}%`);
      } else if (f === 'category') {
        query = query.ilike('category', `%${term}%`);
      } else if (f === 'codigo') {
        query = query.ilike('codigo', `%${term}%`);
      } else if (f === 'description') {
        query = query.ilike('description', `%${term}%`);
      } else if (f === 'price') {
        const num = Number(term);
        if (!isNaN(num)) query = query.eq('price', num);
      } else if (f === 'stock') {
        const num = Number(term);
        if (!isNaN(num)) query = query.eq('stock_quantity', num);
      }
    }
    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search, searchField), 300);
    return () => clearTimeout(t);
  }, [search, searchField]);

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setImagePreview(null); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', brand: p.brand || '', category: p.category || '', price: p.price, original_price: p.original_price, image_url: p.image_url || '', stock_quantity: p.stock_quantity ?? 0, codigo: p.codigo || '', in_stock: p.in_stock, is_new: p.is_new, is_featured: p.is_featured });
    setImagePreview(p.image_url || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) { toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setForm({ ...form, image_url: urlData.publicUrl });
    setImagePreview(urlData.publicUrl);
    setUploading(false);
    toast({ title: 'Imagen subida' });
  };

  const handleExportCSV = async () => {
    const { data } = await supabase.from('products').select('*').order('brand', { ascending: true });
    if (!data?.length) { toast({ title: 'No hay productos', variant: 'destructive' }); return; }
    const headers = ['Código', 'Nombre', 'Descripción', 'Marca', 'Categoría', 'Precio', 'Precio Original', 'Stock'];
    const rows = data.map(p => [p.codigo || '', p.name, p.description || '', p.brand || '', p.category || '', p.price, p.original_price || '', p.stock_quantity]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `productos-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `✅ ${data.length} productos exportados` });
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) { toast({ title: 'Nombre y precio son obligatorios', variant: 'destructive' }); return; }
    setSaving(true);
    const saveData = { ...form, in_stock: form.stock_quantity > 0 };
    const { error } = editing
      ? await supabase.from('products').update(saveData).eq('id', editing.id)
      : await supabase.from('products').insert(saveData);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: editing ? 'Producto actualizado' : 'Producto creado' });
    setSaving(false); setDialogOpen(false); fetchProducts(search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Eliminado' }); fetchProducts(search); }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground flex-1">Productos</h2>
        <button onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-body text-xs text-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Exportar
        </button>
        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <select
          value={searchField}
          onChange={e => { setSearchField(e.target.value); setSearch(''); }}
          className="rounded-lg border border-input bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
        >
          <option value="all">Todos los campos</option>
          <option value="name">Nombre</option>
          <option value="codigo">Código</option>
          <option value="brand">Marca</option>
          <option value="category">Categoría</option>
          <option value="description">Descripción</option>
          <option value="price">Precio exacto</option>
          <option value="stock">Stock exacto</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={searchField === 'price' || searchField === 'stock' ? 'number' : 'text'}
            placeholder={
              searchField === 'all' ? 'Buscar en todos los campos...' :
              searchField === 'price' ? 'Ej: 15000' :
              searchField === 'stock' ? 'Ej: 5' :
              `Buscar por ${searchField === 'name' ? 'nombre' : searchField === 'codigo' ? 'código' : searchField === 'brand' ? 'marca' : searchField === 'category' ? 'categoría' : 'descripción'}...`
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <>
          {/* MOBILE: card list */}
          <div className="space-y-2 lg:hidden">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-12 w-12 shrink-0 rounded-lg object-cover border border-border" />}
                {!p.image_url && <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">🔧</div>}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{p.brand || '—'} · {formatPrice(p.price)}</p>
                  <span className={`font-body text-xs font-medium ${p.stock_quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    Stock: {p.stock_quantity}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="py-12 text-center font-body text-sm text-muted-foreground">No se encontraron productos</p>}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden lg:block overflow-auto rounded-xl border border-border bg-card">
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
                {products.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.codigo || '—'}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.brand || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${p.stock_quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>{p.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No se encontraron productos</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <label className="font-body text-sm text-muted-foreground">Código</label>
              <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" maxLength={50} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-body text-sm text-muted-foreground">Precio *</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground">P. original</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.original_price || ''} onChange={(e) => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground">Stock</label>
                <input type="number" min="0" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground">Descripción</label>
              <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground">Imagen</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              {imagePreview ? (
                <div className="mt-1 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => { setForm({ ...form, image_url: '' }); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; if (cameraInputRef.current) cameraInputRef.current.value = ''; }} className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 font-body text-sm text-muted-foreground hover:border-primary transition-colors disabled:opacity-50">
                    <Upload className="h-4 w-4" />{uploading ? 'Subiendo...' : 'Galería'}
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 px-4 py-2.5 font-body text-sm text-primary hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50">
                    <Camera className="h-4 w-4" />Tomar foto
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} /> Nuevo</label>
              <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Destacado</label>
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
