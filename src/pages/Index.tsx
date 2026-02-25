import { useState, useMemo } from 'react';
import { products, type Brand, type Category } from '@/data/products';
import StoreHeader from '@/components/store/StoreHeader';
import HeroBanner from '@/components/store/HeroBanner';
import FilterSidebar from '@/components/store/FilterSidebar';
import ProductCard from '@/components/store/ProductCard';
import CartDrawer from '@/components/store/CartDrawer';

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedSubCategory && p.subCategory !== selectedSubCategory) return false;
      return true;
    });
  }, [selectedBrand, selectedCategory, selectedSubCategory]);

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <HeroBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <FilterSidebar
            selectedBrand={selectedBrand}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onBrandChange={setSelectedBrand}
            onCategoryChange={setSelectedCategory}
            onSubCategoryChange={setSelectedSubCategory}
          />

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-body text-sm text-muted-foreground">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
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
