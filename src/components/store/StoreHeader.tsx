import { ShoppingCart, User, LogOut, Shield } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useNavigate } from 'react-router-dom';
import fiatLogo from '@/assets/fiat-logo.png';

const StoreHeader = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/80 bg-primary text-primary-foreground backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden">
            <img src={fiatLogo} alt="FIAT Morón" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight tracking-wider text-white">
              FIAT Morón
            </h1>
            <p className="text-xs text-white/60 font-body">Repuestos para tu vehículo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 rounded-lg border-2 border-white/40 bg-black/25 px-3 py-2 font-body text-sm text-white transition-colors hover:bg-black/40"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white px-3 py-2 font-body text-sm text-red-800 transition-colors hover:bg-white/90"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white px-3 py-2 font-body text-sm text-red-800 transition-colors hover:bg-white/90"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 rounded-lg border border-white/20 bg-white px-4 py-2 font-body text-sm font-medium text-red-800 transition-colors hover:bg-white/90"
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
