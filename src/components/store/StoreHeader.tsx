import { ShoppingCart, Wrench, User, LogOut } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StoreHeader = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[hsl(0_0%_5%)] text-white backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight tracking-wider text-white">
              AutoPartes
            </h1>
            <p className="text-xs text-white/60 font-body">Repuestos para tu vehículo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-body text-sm text-white transition-colors hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-body text-sm text-white transition-colors hover:bg-white/20"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
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
      </div>
    </header>
  );
};

export default StoreHeader;
