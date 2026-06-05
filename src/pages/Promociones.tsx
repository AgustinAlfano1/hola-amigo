import { useState } from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import { useProducts } from '@/hooks/useProducts';
import type { Promotion } from '@/hooks/usePromotions';
import { useMemo } from 'react';
import StoreHeader from '@/components/store/StoreHeader';
import CartDrawer from '@/components/store/CartDrawer';
import ProductCard from '@/components/store/ProductCard';
import ProductModal from '@/components/store/ProductModal';
import type { DBProduct } from '@/hooks/useProducts';
import { Zap } from 'lucide-react';

const Promociones = () => {
  const { data: promotions = [], isLoading: loadingPromos } = usePromotions();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);

  const promotionMap = useMemo(() => {
    const map = new Map<string, Promotion>();
    promotions.forEach(p => map.set(p.product_id, p));
    return map;
  }, [promotions]);

  const promoProducts = useMemo(() => {
    return products.filter(p => promotionMap.has(p.id));
  }, [products, promotionMap]);

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
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">
            Promociones
          </h1>
          <p className="font-body text-zinc-400 text-base">
            Ofertas especiales por tiempo limitado. ¡Aprovechalas antes de que venzan!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : promoProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Zap className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <p className="font-heading text-xl text-muted-foreground">No hay promociones activas</p>
            <p className="mt-1 font-body text-sm text-muted-foreground">Volvé más tarde para ver las próximas ofertas</p>
          </div>
        ) : (
          <>
            <p className="font-body text-sm text-muted-foreground mb-6">
              {promoProducts.length} producto{promoProducts.length !== 1 ? 's' : ''} en promoción
            </p>
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
