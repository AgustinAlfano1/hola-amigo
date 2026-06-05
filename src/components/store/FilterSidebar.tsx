import { X, SlidersHorizontal } from 'lucide-react';
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
  };

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    onCategoriesChange(next);
  };

  return (
    <aside className="w-full lg:w-60 shrink-0">
      <div className="rounded-lg border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-zinc-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-semibold tracking-wider text-foreground">Filtros</span>
          </div>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 font-body text-[11px] text-primary hover:underline"
            >
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Brands */}
        <div className="border-b border-border px-4 py-4">
          <h3 className="mb-3 font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Marcas
          </h3>
          {brands.length === 0 ? (
            <p className="font-body text-xs text-muted-foreground italic">Cargando...</p>
          ) : (
            <div className="space-y-1.5">
              {brands.map(brand => (
                <label
                  key={brand}
                  className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 font-body text-sm transition-colors hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => toggleBrand(brand)}
                  />
                  <span className={`text-sm ${selectedBrands.includes(brand) ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                    {brand}
                  </span>
                  {selectedBrands.includes(brand) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="px-4 py-4">
          <h3 className="mb-3 font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Categorías
          </h3>
          {categories.length === 0 ? (
            <p className="font-body text-xs text-muted-foreground italic">
              Seleccioná una marca para ver categorías
            </p>
          ) : (
            <div className="space-y-1.5">
              {categories.map(cat => (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 font-body text-sm transition-colors hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span className={`text-sm ${selectedCategories.includes(cat) ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                    {cat}
                  </span>
                  {selectedCategories.includes(cat) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
