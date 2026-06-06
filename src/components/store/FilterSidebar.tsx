import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
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
  selectedBrands, selectedCategories,
  onBrandsChange, onCategoriesChange,
  brands = [], categories = [],
}: FilterSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasFilters = selectedBrands.length > 0 || selectedCategories.length > 0;
  const activeCount = selectedBrands.length + selectedCategories.length;

  const clearAll = () => { onBrandsChange([]); onCategoriesChange([]); };

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

  const FilterContent = () => (
    <div className="flex flex-col gap-4 lg:gap-0">
      {/* Brands */}
      <div className="lg:border-b lg:border-border lg:px-4 lg:py-4">
        <h3 className="mb-2 font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">Marcas</h3>
        {brands.length === 0 ? (
          <p className="font-body text-xs text-muted-foreground italic">Cargando...</p>
        ) : (
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:space-y-1">
            {brands.map(brand => (
              <label key={brand} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 font-body text-sm transition-colors hover:bg-secondary">
                <Checkbox checked={selectedBrands.includes(brand)} onCheckedChange={() => toggleBrand(brand)} />
                <span className={`text-sm ${selectedBrands.includes(brand) ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{brand}</span>
                {selectedBrands.includes(brand) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="lg:px-4 lg:py-4">
          <h3 className="mb-2 font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">Categorías</h3>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:space-y-1">
            {categories.map(cat => (
              <label key={cat} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 font-body text-sm transition-colors hover:bg-secondary">
                <Checkbox checked={selectedCategories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                <span className={`text-sm ${selectedCategories.includes(cat) ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{cat}</span>
                {selectedCategories.includes(cat) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* MOBILE: collapsible panel */}
      <div className="w-full lg:hidden">
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-semibold tracking-wider">Filtros</span>
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-body text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                className="flex items-center gap-1 font-body text-xs text-primary hover:underline"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
            {mobileOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {mobileOpen && (
          <div className="mt-2 rounded-xl border border-border bg-card p-4">
            <FilterContent />
          </div>
        )}
      </div>

      {/* DESKTOP: sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="rounded-lg border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between border-b border-border bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="font-heading text-sm font-semibold tracking-wider text-foreground">Filtros</span>
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 font-body text-[11px] text-primary hover:underline">
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          <FilterContent />
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
