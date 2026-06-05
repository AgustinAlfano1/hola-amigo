import { useState, useMemo } from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import { useProducts } from '@/hooks/useProducts';
import type { Promotion } from '@/hooks/usePromotions';
import type { DBProduct } from '@/hooks/useProducts';
import type { SortOption } from '@/components/store/SortBar';
import StoreHeader from '@/components/store/StoreHeader';
import CartDrawer from '@/components/store/CartDrawer';
import ProductCard from '@/components/store/ProductCard';
import ProductModal from '@/components/store/ProductModal';
import SortBar from '@/components/store/SortBar';
import { Zap } from 'lucide-react';

const applySort = (products: DBProduct[], sort: SortOption, promoMap: Map<string, Promotion>) => {
  const arr = [...products];
  const getPrice = (p: DBProduct) => promoMap.get(p.id)?.promotional_price ?? p.price;
  switch (sort) {
    case 'price-asc':  return arr.sort((a, b) => getPrice(a) - getPrice(b));
    case 'price-desc': return arr.sort((a, b) => getPrice(b) - getPrice(a));
    case 'name-asc':   return arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    case 'name-desc':  return arr.sort((a, b) => b.name.localeCompare(a.name, 'es'));
    case 'featured':   return arr.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    default:           return arr;
  }
};

const Promociones = () => {
  const { data: promotions = [], isLoading: loadingPromos } = usePromotions();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const [sort, setSort] = useState<SortOption>('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const promotionMap = useMemo(() => {
    const map = new Map<string, Promotion>();
    promotions.forEach(p => map.set(p.product_id, p));
    return map;
  }, [promotions]);

  const hasActiveFilters = sort !== 'default' || minPrice !== '' || maxPrice !== '' || onlyInStock;

  const promoProducts = useMemo(() => {
    let result = products.filter(p => {
      if (!promotionMap.has(p.id)) return false;
      if (onlyInStock && p.stock_quantity <= 0) return false;
      const promoPrice = promotionMap.get(p.id)!.promotional_price;
      if (minPrice && promoPrice < Number(minPrice)) return false;
      if (maxPrice && promoPrice > Number(maxPrice)) return false;
      return true;
    });
    return applySort(result, sort, promotionMap);
  }, [products, promotionMap, sort, minPrice, maxPrice, onlyInStock]);

  const selectedPromotion = selectedProduct ? promotionMap.get(selectedProduct.id) : undefined;
  const isLoading = loadingPromos || loadingProducts;

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <CartDrawer />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="container mx-auto px-4 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 mb-4">
            <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="font-body text-xs text-amber-400 tracking-widest uppercase font-medium">Tiempo limitado</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">Promociones</h1>
          <p className="font-body text-zinc-400 text-base">Ofertas especiales por tiempo limitado. ¡Aprovechalas antes de que venzan!</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Zap className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <p className="font-heading text-xl text-muted-foreground">No hay promociones activas</p>
            <p className="mt-1 font-body text-sm text-muted-foreground">Volvé más tarde para ver las próximas ofertas</p>
          </div>
        ) : (
          <>
            <SortBar
              sort={sort} onSortChange={setSort}
              minPrice={minPrice} maxPrice={maxPrice}
              onMinPriceChange={setMinPrice} onMaxPriceChange={setMaxPrice}
              onlyInStock={onlyInStock} onOnlyInStockChange={setOnlyInStock}
              onClear={() => { setSort('default'); setMinPrice(''); setMaxPrice(''); setOnlyInStock(false); }}
              hasActiveFilters={hasActiveFilters}
            />

            <p className="font-body text-sm text-muted-foreground mb-6">
              {promoProducts.length} producto{promoProducts.length !== 1 ? 's' : ''} en promoción
            </p>

            {promoProducts.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <p className="font-body text-sm text-muted-foreground">Ningún producto coincide con los filtros aplicados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {promoProducts.map((product, i) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <ProductCard
                      product={product}
                      promotion={promotionMap.get(product.id)}
                      onClick={() => setSelectedProduct(product)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ProductModal
        product={selectedProduct}
        promotion={selectedPromotion}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default Promociones;
