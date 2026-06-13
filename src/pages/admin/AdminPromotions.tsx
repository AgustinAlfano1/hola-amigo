import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAllPromotions } from '@/hooks/usePromotions';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, Zap, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
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
  const [showDropdown, setShowDropdown] = useState(false);
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
    if (term.trim().length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    setSearching(true);
    setShowDropdown(true);
    const term = search.trim();
    const { data } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${term}%`)
      .order('name')
      .limit(20);
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleSelectProduct = (product: Product) => {
    setSelected(product);
    setSearch(product.name + (product.brand ? ` (${product.brand})` : ''));
    setSearchResults([]);
    setShowDropdown(false);
    setPromoPrice(String(Math.round(product.price * 0.8)));
  };

  const handleSave = async () => {
    if (!selected || !promoPrice || !expiresAt) {
      toast({ title: 'Completá todos los campos', variant: 'destructive' });
      return;
    }
    if (selected.stock_quantity <= 0) {
      toast({ title: 'Sin stock', description: 'Este producto no tiene stock disponible para entrar en promoción.', variant: 'destructive' });
      return;
    }
    if (Number(promoPrice) >= selected.price) {
      toast({ title: 'Precio inválido', description: 'El precio promocional debe ser menor al precio original.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await supabase.from('promotions').update({ is_active: false }).eq('product_id', selected.id).eq('is_active', true);
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
      setSelected(null); setSearch(''); setPromoPrice(''); setExpiresAt('');
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

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
  const minDateStr = minDate.toISOString().slice(0, 16);

  const activePromos = promotions.filter((p: any) => p.is_active && !isExpired(p.expires_at));
  const expiredPromos = promotions.filter((p: any) => !p.is_active || isExpired(p.expires_at));

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
          <Zap className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Promociones</h2>
          <p className="font-body text-xs text-muted-foreground">Los precios vuelven al original automáticamente al vencer</p>
        </div>
      </div>

      {/* Create form */}
      <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 lg:p-6">
        <h3 className="font-heading text-sm font-bold tracking-wider text-foreground mb-4">Nueva promoción</h3>

        {/* Product search with dropdown */}
        <div className="relative mb-4">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Producto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Escribí para buscar por nombre o marca..."
              value={search}
              onChange={(e) => { handleSearch(e.target.value); setSelected(null); }}
              onFocus={() => search.length > 0 && setShowDropdown(true)}
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
              {searching ? (
                <div className="px-4 py-3 font-body text-sm text-muted-foreground">Buscando...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 font-body text-sm text-muted-foreground">Sin resultados</div>
              ) : (
                searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="flex w-full items-center justify-between px-4 py-3 font-body text-sm hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Stock indicator */}
                      <div className={`h-2 w-2 shrink-0 rounded-full ${p.stock_quantity > 0 ? 'bg-green-500' : 'bg-destructive'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{p.name}</p>
                        {p.brand && <p className="text-xs text-muted-foreground">{p.brand} · {p.category || '—'}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-semibold text-foreground">{formatPrice(p.price)}</p>
                      <p className={`text-xs ${p.stock_quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        Stock: {p.stock_quantity}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* No stock warning */}
        {selected && selected.stock_quantity <= 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="font-body text-sm text-destructive">
              Este producto no tiene stock disponible. No puede entrar en promoción.
            </p>
          </div>
        )}

        {/* Selected product info */}
        {selected && selected.stock_quantity > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{selected.name}</p>
              <p className="font-body text-xs text-muted-foreground">Precio actual: {formatPrice(selected.price)} · Stock: {selected.stock_quantity}</p>
            </div>
            <button onClick={() => { setSelected(null); setSearch(''); setPromoPrice(''); }} className="font-body text-xs text-primary hover:underline">Cambiar</button>
          </div>
        )}

        {/* Price + date */}
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="font-body text-sm text-muted-foreground">Precio promocional (ARS)</label>
            <input
              type="number"
              placeholder="Ej: 49900"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              disabled={!!selected && selected.stock_quantity <= 0}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            {selected && promoPrice && Number(promoPrice) > 0 && Number(promoPrice) < selected.price && (
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
              disabled={!!selected && selected.stock_quantity <= 0}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selected || !promoPrice || !expiresAt || selected.stock_quantity <= 0}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 font-heading text-sm font-bold tracking-widest text-white transition-colors hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Crear promoción'}
        </button>
      </div>

      {/* Active promotions */}
      <h3 className="font-heading text-sm font-bold tracking-wider text-foreground mb-3">
        Activas ({activePromos.length})
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
          {[...activePromos, ...expiredPromos].map((promo: any) => {
            const expired = isExpired(promo.expires_at);
            return (
              <div key={promo.id} className={`flex items-center gap-3 rounded-xl border p-3 lg:p-4 ${expired ? 'border-border bg-muted/30 opacity-60' : 'border-amber-500/20 bg-card'}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${expired ? 'bg-muted' : 'bg-amber-500/15'}`}>
                  {expired ? <AlertCircle className="h-4 w-4 text-muted-foreground" /> : <Zap className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Desktop */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">
                        {promo.products?.name || 'Producto eliminado'}
                        {promo.products?.brand && <span className="ml-2 text-xs text-muted-foreground">{promo.products.brand}</span>}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-body text-xs text-muted-foreground line-through">{formatPrice(promo.products?.price || 0)}</span>
                        <span className="font-body text-xs font-bold text-amber-600">{formatPrice(promo.promotional_price)}</span>
                        <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{expired ? 'Vencida' : `Vence: ${formatDate(promo.expires_at)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Mobile */}
                  <div className="lg:hidden">
                    <p className="font-body text-sm font-medium text-foreground truncate">{promo.products?.name || 'Producto eliminado'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="font-body text-xs text-muted-foreground line-through">{formatPrice(promo.products?.price || 0)}</span>
                      <span className="font-body text-xs font-bold text-amber-600">{formatPrice(promo.promotional_price)}</span>
                      <span className="font-body text-xs text-muted-foreground">{expired ? '· Vencida' : `· ${formatDate(promo.expires_at)}`}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(promo.id)} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
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
