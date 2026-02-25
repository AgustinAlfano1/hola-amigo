import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import StoreHeader from '@/components/store/StoreHeader';
import HeroBanner from '@/components/store/HeroBanner';
import FilterSidebar from '@/components/store/FilterSidebar';
import ProductCard from '@/components/store/ProductCard';
import CartDrawer from '@/components/store/CartDrawer';

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useProducts(searchTerm);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      return true;
    });
  }, [products, selectedBrand, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <HeroBanner searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <FilterSidebar
            selectedBrand={selectedBrand}
            selectedCategory={selectedCategory}
            onBrandChange={setSelectedBrand}
            onCategoryChange={setSelectedCategory}
          />

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-body text-sm text-muted-foreground">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              </p>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product, i) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CartDrawer />
    </div>
  );
};

export default Index;
