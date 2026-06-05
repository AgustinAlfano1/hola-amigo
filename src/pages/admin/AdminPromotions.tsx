import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAllPromotions } from '@/hooks/usePromotions';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, Zap, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const AdminPromotions = () => {
  const { data: promotions = [], isLoading } = useAllPromotions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [promoPrice, setPromoPrice] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const isExpired = (iso: string) => new Date(iso) < new Date();

  const handleSearch = async (term: string) => {
    setSearch(term);
    if (term.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from('products').select('*')
      .or(`name.ilike.%${term}%,brand.ilike.%${term}%`).limit(8);
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleSelectProduct = (product: Product) => {
    setSelected(product);
    setPromoPrice(String(Math.round(product.price * 0.8)));
    setSearch('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    if (!selected || !promoPrice || !expiresAt) {
      toast({ title: 'Completá todos los campos', variant: 'destructive' });
      return;
    }
    if (Number(promoPrice) >= selected.price) {
      toast({ title: 'El precio promocional debe ser menor al original', variant: 'destructive' });
      return;
    }
    setSaving(true);
    // Deactivate existing promotion for this product
    await supabase.from('promotions').update({ is_active: false })
      .eq('product_id', selected.id).eq('is_active', true);

    const { error } = await supabase.from('promotions').insert({
      product_id: selected.id,
      promotional_price: Number(promoPrice),
      expires_at: new Date(expiresAt).toISOString(),
      is_active: true,
    });

    if (error) {
      toast({ title: 'Error al crear promoción', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Promoción creada' });
      setSelected(null);
      setPromoPrice('');
      setExpiresAt('');
      queryClient.invalidateQueries({ queryKey: ['promotions-all'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    await supabase.from('promotions').delete().eq('id', id);
    toast({ title: 'Promoción eliminada' });
    queryClient.invalidateQueries({ queryKey: ['promotions-all'] });
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
  };

  // Min datetime: now
  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
          <Zap className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Promociones</h2>
          <p className="font-body text-xs text-muted-foreground">Los precios vuelven al original automáticamente al vencer</p>
        </div>
      </div>

      {/* Create form */}
      <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h3 className="font-heading text-sm font-bold tracking-wider text-foreground mb-4">Nueva promoción</h3>

        {/* Product search */}
        {!selected ? (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o marca..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="flex w-full items-center justify-between px-4 py-3 font-body text-sm hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <span className="font-medium text-foreground">{p.name}</span>
                      {p.brand && <span className="ml-2 text-xs text-muted-foreground">{p.brand}</span>}
                    </div>
                    <span className="text-foreground font-medium">{formatPrice(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {searching && <p className="mt-2 font-body text-xs text-muted-foreground">Buscando...</p>}
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{selected.name}</p>
              <p className="font-body text-xs text-muted-foreground">Precio actual: {formatPrice(selected.price)}</p>
            </div>
            <button onClick={() => setSelected(null)} className="font-body text-xs text-primary hover:underline">Cambiar</button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-body text-sm text-muted-foreground">Precio promocional (ARS)</label>
            <input
              type="number"
              placeholder="Ej: 49900"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {selected && promoPrice && Number(promoPrice) < selected.price && (
              <p className="mt-1 font-body text-xs text-green-600">
                {Math.round(((selected.price - Number(promoPrice)) / selected.price) * 100)}% de descuento
              </p>
            )}
          </div>
          <div>
            <label className="font-body text-sm text-muted-foreground">Fecha y hora de vencimiento</label>
            <input
              type="datetime-local"
              min={minDateStr}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selected || !promoPrice || !expiresAt}
          className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 font-heading text-sm font-bold tracking-widest text-white transition-colors hover:bg-amber-600 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Crear promoción'}
        </button>
      </div>

      {/* Active promotions list */}
      <h3 className="font-heading text-sm font-bold tracking-wider text-foreground mb-3">
        Promociones activas ({promotions.filter(p => p.is_active && !isExpired(p.expires_at)).length})
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-body text-sm text-muted-foreground">No hay promociones creadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo: any) => {
            const expired = isExpired(promo.expires_at);
            return (
              <div key={promo.id} className={`flex items-center justify-between rounded-xl border p-4 ${expired ? 'border-border bg-muted/30 opacity-60' : 'border-amber-500/20 bg-card'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${expired ? 'bg-muted' : 'bg-amber-500/15'}`}>
                    {expired ? <AlertCircle className="h-4 w-4 text-muted-foreground" /> : <Zap className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      {promo.products?.name || 'Producto eliminado'}
                      {promo.products?.brand && <span className="ml-2 text-xs text-muted-foreground">{promo.products.brand}</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-body text-xs text-muted-foreground line-through">{formatPrice(promo.products?.price || 0)}</span>
                      <span className="font-body text-xs font-bold text-amber-600">{formatPrice(promo.promotional_price)}</span>
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {expired ? 'Vencida' : `Vence: ${formatDate(promo.expires_at)}`}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(promo.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPromotions;
