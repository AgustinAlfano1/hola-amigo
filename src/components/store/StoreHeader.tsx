import { ShoppingCart, Wrench } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const StoreHeader = () => {
  const { totalItems, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight tracking-wider text-foreground">
              AutoPartes
            </h1>
            <p className="text-xs text-muted-foreground font-body">Repuestos para tu vehículo</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 font-body text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default StoreHeader;
