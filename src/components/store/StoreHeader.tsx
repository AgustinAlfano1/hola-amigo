import { ShoppingCart, User, LogOut, Shield, Phone, MapPin, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useNavigate } from 'react-router-dom';

const WHATSAPP_NUMBER = '5491149989332';
const WHATSAPP_MSG = encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre repuestos. 🔧');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

const StoreHeader = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-zinc-900 text-zinc-400 text-xs">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              Morón, Buenos Aires
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-primary" />
              Lun–Vie 8:00–18:00 · Sáb 8:00–13:00
            </span>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors"
          >
            <Phone className="h-3 w-3" />
            Contactanos por WhatsApp
          </a>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-primary/30 bg-zinc-950 text-white shadow-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded bg-zinc-900 border border-white/10 p-1 shrink-0">
              <img src="/fiat-logo.png" alt="FIAT" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold leading-none tracking-widest text-white group-hover:text-primary transition-colors">
                FIAT MORÓN
              </h1>
              <p className="text-[10px] font-body text-zinc-400 tracking-widest uppercase mt-0.5">
                Repuestos & Accesorios
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 font-body text-sm text-zinc-300">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors tracking-wide uppercase text-xs font-medium">Productos</button>
            <span className="text-zinc-600">|</span>
            <button onClick={() => navigate('/promociones')} className="flex items-center gap-1 hover:text-amber-400 transition-colors tracking-wide uppercase text-xs font-medium text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Promociones
            </button>
            <span className="text-zinc-600">|</span>
            <button onClick={() => navigate('/contacto')} className="hover:text-primary transition-colors tracking-wide uppercase text-xs font-medium text-zinc-500">Contacto</button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-body text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {user ? (
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-body text-xs text-zinc-300 transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-body text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ingresar</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-2 rounded bg-primary px-4 py-2 font-body text-xs font-semibold text-white transition-colors hover:bg-primary/85 tracking-wide uppercase"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
