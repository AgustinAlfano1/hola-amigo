import { brands, categories, subCategories, type Brand, type Category } from '@/data/products';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  selectedBrand: Brand | null;
  selectedCategory: Category | null;
  selectedSubCategory: string | null;
  onBrandChange: (brand: Brand | null) => void;
  onCategoryChange: (category: Category | null) => void;
  onSubCategoryChange: (sub: string | null) => void;
}

const FilterSidebar = ({
  selectedBrand,
  selectedCategory,
  selectedSubCategory,
  onBrandChange,
  onCategoryChange,
  onSubCategoryChange,
}: FilterSidebarProps) => {
  const hasFilters = selectedBrand || selectedCategory || selectedSubCategory;

  const clearAll = () => {
    onBrandChange(null);
    onCategoryChange(null);
    onSubCategoryChange(null);
  };

  return (
    <aside className="w-full space-y-6 lg:w-64">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 font-body text-xs text-primary hover:underline"
        >
          <X className="h-3 w-3" /> Limpiar filtros
        </button>
      )}

      {/* Brands */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold tracking-wider text-foreground">
          Marcas
        </h3>
        <div className="flex flex-wrap gap-2">
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => onBrandChange(selectedBrand === brand ? null : brand)}
              className={`rounded-md border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                selectedBrand === brand
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-secondary text-secondary-foreground hover:border-primary/50'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold tracking-wider text-foreground">
          Categorías
        </h3>
        <div className="space-y-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                onCategoryChange(selectedCategory === cat ? null : cat);
                onSubCategoryChange(null);
              }}
              className={`block w-full rounded-md px-3 py-2 text-left font-body text-sm transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {selectedCategory && (
        <div>
          <h3 className="mb-3 font-heading text-sm font-semibold tracking-wider text-foreground">
            Subcategorías
          </h3>
          <div className="space-y-1">
            {subCategories[selectedCategory].map(sub => (
              <button
                key={sub}
                onClick={() => onSubCategoryChange(selectedSubCategory === sub ? null : sub)}
                className={`block w-full rounded-md px-3 py-2 text-left font-body text-sm transition-colors ${
                  selectedSubCategory === sub
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default FilterSidebar;
