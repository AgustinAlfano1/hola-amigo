import { ArrowUpDown, DollarSign, X } from 'lucide-react';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest' | 'featured';

interface SortBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onlyInStock: boolean;
  onOnlyInStockChange: (val: boolean) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default',    label: 'Más recientes' },
  { value: 'price-asc',  label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc',   label: 'Nombre: A → Z' },
  { value: 'name-desc',  label: 'Nombre: Z → A' },
  { value: 'featured',   label: 'Destacados primero' },
];

const SortBar = ({
  sort, onSortChange,
  minPrice, maxPrice, onMinPriceChange, onMaxPriceChange,
  onlyInStock, onOnlyInStockChange,
  onClear, hasActiveFilters,
}: SortBarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">

      {/* Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-transparent font-body text-sm text-foreground focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="h-5 w-px bg-border hidden sm:block" />

      {/* Price range */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          type="number"
          placeholder="Desde"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          className="w-24 rounded-lg border border-input bg-background px-2 py-1 font-body text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="font-body text-xs text-muted-foreground">—</span>
        <input
          type="number"
          placeholder="Hasta"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          className="w-24 rounded-lg border border-input bg-background px-2 py-1 font-body text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="h-5 w-px bg-border hidden sm:block" />

      {/* Stock toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <div
          onClick={() => onOnlyInStockChange(!onlyInStock)}
          className={`relative h-5 w-9 rounded-full transition-colors ${onlyInStock ? 'bg-primary' : 'bg-muted'}`}
        >
          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${onlyInStock ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
        <span className="font-body text-xs text-muted-foreground whitespace-nowrap">Solo con stock</span>
      </label>

      {/* Clear */}
      {hasActiveFilters && (
        <>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <button
            onClick={onClear}
            className="flex items-center gap-1 font-body text-xs text-primary hover:underline"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        </>
      )}
    </div>
  );
};

export default SortBar;
