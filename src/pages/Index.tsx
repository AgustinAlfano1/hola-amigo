import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { usePromotions } from '@/hooks/usePromotions';
import type { Promotion } from '@/hooks/usePromotions';
import { useToast } from '@/hooks/use-toast';
import StoreHeader from '@/components/store/StoreHeader';
import HeroBanner from '@/components/store/HeroBanner';
import FilterSidebar from '@/components/store/FilterSidebar';
import ProductCard from '@/components/store/ProductCard';
import ProductModal from '@/components/store/ProductModal';
import CartDrawer from '@/components/store/CartDrawer';
import type { DBProduct } from '@/hooks/useProducts';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const PAGE_SIZE = 15;

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

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment) {
      if (payment === 'success') toast({ title: '¡Pago exitoso!', description: 'Tu pedido fue confirmado. Gracias por tu compra.' });
      else if (payment === 'failure') toast({ title: 'Pago rechazado', description: 'El pago no se pudo procesar. Intentá de nuevo.', variant: 'destructive' });
      else if (payment === 'pending') toast({ title: 'Pago pendiente', description: 'Tu pago está siendo procesado.' });
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
    const set = new Set(products.map(p => p.brand).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const availableCategories = useMemo(() => {
    const pool = selectedBrands.length > 0
      ? products.filter(p => p.brand && selectedBrands.includes(p.brand))
      : products;
    const set = new Set(pool.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
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

  const handleCategoriesChange = (cats: string[]) => {
    setSelectedCategories(cats);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // All filtered products (no pagination yet)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) return false;
      if (selectedCategories.length > 0 && (!p.category || !selectedCategories.includes(p.category))) return false;
      return true;
    });
  }, [products, selectedBrands, selectedCategories]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  // Paginated slice
  const visibleProducts = useMemo(() => {
    if (showAll) return filteredProducts;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage, showAll]);

  const selectedPromotion = selectedProduct ? promotionMap.get(selectedProduct.id) : undefined;

  // Page numbers to show (max 5 around current)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
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
      <HeroBanner searchTerm={searchTerm} onSearchChange={handleSearchChange} />

      <div ref={productsRef} className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <FilterSidebar
            selectedBrands={selectedBrands}
            selectedCategories={selectedCategories}
            onBrandsChange={handleBrandsChange}
            onCategoriesChange={handleCategoriesChange}
            brands={brands}
            categories={availableCategories}
          />

          <div className="flex-1">
            {/* Header bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-body text-sm text-muted-foreground">
                {showAll
                  ? `${filteredProducts.length} productos`
                  : `${Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProducts.length)}–${Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de ${filteredProducts.length} productos`
                }
                {promotions.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 font-body text-xs font-medium text-amber-600">
                    {promotions.length} en promoción
                  </span>
                )}
              </p>

              {/* Show all toggle */}
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((product, i) => (
                    <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <ProductCard
                        product={product}
                        promotion={promotionMap.get(product.id)}
                        onClick={() => setSelectedProduct(product)}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
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
