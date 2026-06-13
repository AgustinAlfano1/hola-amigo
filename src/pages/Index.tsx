import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { usePromotions } from '@/hooks/usePromotions';
import type { Promotion } from '@/hooks/usePromotions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StoreHeader from '@/components/store/StoreHeader';
import HeroBanner from '@/components/store/HeroBanner';
import FilterSidebar from '@/components/store/FilterSidebar';
import ProductCard from '@/components/store/ProductCard';
import ProductModal from '@/components/store/ProductModal';
import CartDrawer from '@/components/store/CartDrawer';
import SortBar from '@/components/store/SortBar';
import type { SortOption } from '@/components/store/SortBar';
import type { DBProduct } from '@/hooks/useProducts';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const PAGE_SIZE = 15;

const applySort = (products: DBProduct[], sort: SortOption) => {
  const arr = [...products];
  switch (sort) {
    case 'price-asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price-desc': return arr.sort((a, b) => b.price - a.price);
    case 'name-asc':   return arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    case 'name-desc':  return arr.sort((a, b) => b.name.localeCompare(a.name, 'es'));
    case 'featured':   return arr.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    default:           return arr;
  }
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  // Sort & extra filters
  const [sort, setSort] = useState<SortOption>('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    if (payment) {
      if (payment === 'success') toast({ title: '¡Pago exitoso!', description: 'Tu pedido fue confirmado. Gracias por tu compra.' });
      else if (payment === 'failure') toast({ title: 'Pago rechazado', description: 'El pago no se pudo procesar. Intentá de nuevo.', variant: 'destructive' });
      else if (payment === 'pending') toast({ title: 'Pago pendiente', description: 'Tu pago está siendo procesado.' });

      // Insertar notificación para el admin
      if (orderId) {
        (async () => {
          const { data: order } = await supabase
            .from('orders')
            .select('billing_name, billing_dni_cuit, invoice_type, delivery_type, shipping_address, shipping_postal_code, shipping_cost, total_amount, user_id')
            .eq('id', orderId)
            .single();

          if (order) {
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('product_name, product_brand, quantity, price_at_purchase')
              .eq('order_id', orderId);

            const { data: profile } = await supabase
              .from('profiles')
              .select('phone')
              .eq('id', order.user_id)
              .single();

            const statusText = payment === 'success' ? '✅ Pago aprobado' : payment === 'failure' ? '❌ Pago rechazado' : '⏳ Pago pendiente';
            const total = Number(order.total_amount).toLocaleString('es-AR');
            const itemsList = (orderItems || [])
              .map((i: any) => `${i.quantity}x ${i.product_name}${i.product_brand ? ` (${i.product_brand})` : ''} - $${Number(i.price_at_purchase).toLocaleString('es-AR')}`)
              .join(' | ');
            const deliveryText = order.delivery_type === 'shipping'
              ? `Envío: ${order.shipping_address || ''} (CP: ${order.shipping_postal_code || ''})`
              : 'Retiro en local';

            const message = [
              `${order.billing_name || 'Cliente'} - Total: $${total}`,
              profile?.phone ? `Tel: ${profile.phone}` : null,
              order.billing_dni_cuit ? `DNI/CUIT: ${order.billing_dni_cuit}` : null,
              order.invoice_type === 'factura_a' ? 'Factura A' : 'Consumidor Final',
              deliveryText,
              itemsList ? `Productos: ${itemsList}` : null,
            ].filter(Boolean).join(' | ');

            await supabase.from('notifications').insert({
              type: 'order',
              title: statusText,
              message,
              order_id: orderId,
            });
          }
        })();
      }

      searchParams.delete('payment');
      searchParams.delete('order_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const { data: products = [], isLoading } = useProducts(searchTerm);
  const { data: promotions = [] } = usePromotions();

  const promotionMap = useMemo(() => {
    const map = new Map<string, Promotion>();
    promotions.forEach(p => map.set(p.product_id, p));
    return map;
  }, [promotions]);

  const brands = useMemo(() => {
    const seen = new Map<string, string>();
    products.forEach(p => {
      if (p.brand) {
        const key = p.brand.trim().toUpperCase();
        if (!seen.has(key)) seen.set(key, p.brand.trim());
      }
    });
    return Array.from(seen.values()).sort();
  }, [products]);

  const availableCategories = useMemo(() => {
    const pool = selectedBrands.length > 0
      ? products.filter(p => p.brand && selectedBrands.includes(p.brand))
      : products;
    const seen = new Map<string, string>();
    pool.forEach(p => {
      if (p.category) {
        const key = p.category.trim().toUpperCase();
        if (!seen.has(key)) seen.set(key, p.category.trim());
      }
    });
    return Array.from(seen.values()).sort();
  }, [products, selectedBrands]);

  const handleBrandsChange = (newBrands: string[]) => {
    setSelectedBrands(newBrands);
    const pool = newBrands.length > 0
      ? products.filter(p => p.brand && newBrands.includes(p.brand))
      : products;
    const validCats = new Set(pool.map(p => p.category).filter(Boolean) as string[]);
    setSelectedCategories(prev => prev.filter(c => validCats.has(c)));
    setCurrentPage(1);
  };

  const resetPage = () => setCurrentPage(1);

  const clearSortFilters = () => {
    setSort('default');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = sort !== 'default' || minPrice !== '' || maxPrice !== '' || onlyInStock;

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) return false;
      if (selectedCategories.length > 0 && (!p.category || !selectedCategories.includes(p.category))) return false;
      if (onlyInStock && p.stock_quantity <= 0) return false;
      const effectivePrice = promotionMap.get(p.id)?.promotional_price ?? p.price;
      if (minPrice && effectivePrice < Number(minPrice)) return false;
      if (maxPrice && effectivePrice > Number(maxPrice)) return false;
      return true;
    });
    return applySort(result, sort);
  }, [products, selectedBrands, selectedCategories, sort, minPrice, maxPrice, onlyInStock, promotionMap]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  const visibleProducts = useMemo(() => {
    if (showAll) return filteredProducts;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage, showAll]);

  const selectedPromotion = selectedProduct ? promotionMap.get(selectedProduct.id) : undefined;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...'); pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1); pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1); pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...'); pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const scrollToProducts = () => {
    if (!productsRef.current) return;
    const top = productsRef.current.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <HeroBanner searchTerm={searchTerm} onSearchChange={(t) => { setSearchTerm(t); resetPage(); }} />

      <div ref={productsRef} className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <FilterSidebar
            selectedBrands={selectedBrands}
            selectedCategories={selectedCategories}
            onBrandsChange={handleBrandsChange}
            onCategoriesChange={(c) => { setSelectedCategories(c); resetPage(); }}
            brands={brands}
            categories={availableCategories}
          />

          <div className="flex-1">
            {/* SortBar */}
            <SortBar
              sort={sort} onSortChange={(s) => { setSort(s); resetPage(); }}
              minPrice={minPrice} maxPrice={maxPrice}
              onMinPriceChange={(v) => { setMinPrice(v); resetPage(); }}
              onMaxPriceChange={(v) => { setMaxPrice(v); resetPage(); }}
              onlyInStock={onlyInStock} onOnlyInStockChange={(v) => { setOnlyInStock(v); resetPage(); }}
              onClear={clearSortFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Counter + show all */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-body text-sm text-muted-foreground">
                {showAll
                  ? `${filteredProducts.length} productos`
                  : `${Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProducts.length || 1)}–${Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de ${filteredProducts.length} productos`
                }
                {promotions.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 font-body text-xs font-medium text-amber-600">
                    {promotions.length} en promoción
                  </span>
                )}
              </p>
              {filteredProducts.length > PAGE_SIZE && (
                <button
                  onClick={() => { setShowAll(v => !v); setCurrentPage(1); }}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-body text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {showAll ? 'Mostrar paginado' : 'Ver todos'}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="font-heading text-lg text-muted-foreground">No se encontraron productos</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Probá con otros filtros</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 md:gap-4 xl:grid-cols-3">
                  {visibleProducts.map((product, i) => (
                    <div key={product.id} className={`animate-fade-in${visibleProducts.length % 2 !== 0 && i === visibleProducts.length - 1 ? ' col-span-2 md:col-span-1' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
                      <ProductCard
                        product={product}
                        promotion={promotionMap.get(product.id)}
                        onClick={() => setSelectedProduct(product)}
                      />
                    </div>
                  ))}
                </div>

                {!showAll && totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1">
                    <button
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollToProducts(); }}
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {pageNumbers.map((page, i) =>
                      page === '...' ? (
                        <span key={`dots-${i}`} className="flex h-9 w-9 items-center justify-center font-body text-sm text-muted-foreground">…</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => { setCurrentPage(page as number); scrollToProducts(); }}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg font-body text-sm transition-colors ${
                            currentPage === page
                              ? 'bg-primary text-white font-bold'
                              : 'border border-border bg-background text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); scrollToProducts(); }}
                      disabled={currentPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CartDrawer />
      <ProductModal
        product={selectedProduct}
        promotion={selectedPromotion}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default Index;
