import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface FilterSidebarProps {
  selectedBrands: string[];
  selectedCategories: string[];
  onBrandsChange: (brands: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  brands: string[];
  categories: string[];
}

const FilterSidebar = ({
  selectedBrands,
  selectedCategories,
  onBrandsChange,
  onCategoriesChange,
  brands = [],
  categories = [],
}: FilterSidebarProps) => {
  const hasFilters = selectedBrands.length > 0 || selectedCategories.length > 0;

  const clearAll = () => {
    onBrandsChange([]);
    onCategoriesChange([]);
  };

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    onBrandsChange(next);
    // Remove categories that are no longer valid will be handled by parent
  };

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    onCategoriesChange(next);
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

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold tracking-wider text-foreground">
          Marcas
        </h3>
        <div className="space-y-2">
          {brands.map(brand => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-body text-sm transition-colors hover:bg-secondary"
            >
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <span className={selectedBrands.includes(brand) ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold tracking-wider text-foreground">
          Categorías
        </h3>
        {categories.length === 0 ? (
          <p className="px-2 font-body text-xs text-muted-foreground">
            Seleccioná una marca para ver categorías
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <label
                key={cat}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-body text-sm transition-colors hover:bg-secondary"
              >
                <Checkbox
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                />
                <span className={selectedCategories.includes(cat) ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FilterSidebar;
