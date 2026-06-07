import { useState } from 'react';
import { ShoppingCart, User, LogOut, Shield, Phone, MapPin, Clock, Menu, X, Zap, Home, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useNavigate, useLocation } from 'react-router-dom';

const WHATSAPP_URL = `https://wa.me/5491149989332?text=${encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre repuestos. 🔧')}`;

const StoreHeader = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => { navigate(path); setMobileMenuOpen(false); };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50">

      {/* Top info bar — desktop only */}
      <div className="hidden lg:block bg-zinc-900 text-zinc-400 text-xs">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" />Morón, Buenos Aires</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" />Lun–Vie 8:00–18:00 · Sáb 8:00–13:00</span>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors">
            <Phone className="h-3 w-3" />Contactanos por WhatsApp
          </a>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-primary/30 bg-zinc-950 text-white shadow-lg">
        <div className="container mx-auto flex h-14 lg:h-16 items-center justify-between px-4">

          {/* Logo */}
          <div className="flex items-center gap-2 lg:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 lg:h-11 lg:w-11 items-center justify-center overflow-hidden rounded bg-zinc-900 border border-white/10 p-1 shrink-0">
              <img src="/fiat-logo.png" alt="FIAT" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h1 className="font-heading text-base lg:text-xl font-bold leading-none tracking-widest text-white group-hover:text-primary transition-colors">FIAT MORÓN</h1>
              <p className="hidden lg:block text-[10px] font-body text-zinc-400 tracking-widest uppercase mt-0.5">Repuestos & Accesorios</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 font-body text-sm text-zinc-300">
            <button onClick={() => navigate('/')} className={`hover:text-primary transition-colors tracking-wide uppercase text-xs font-medium ${isActive('/') ? 'text-primary' : ''}`}>Productos</button>
            <span className="text-zinc-600">|</span>
            <button onClick={() => navigate('/promociones')} className={`flex items-center gap-1 transition-colors tracking-wide uppercase text-xs font-medium ${isActive('/promociones') ? 'text-amber-400' : 'text-amber-500 hover:text-amber-400'}`}>
              <Zap className="h-3 w-3" />Promociones
            </button>
            <span className="text-zinc-600">|</span>
            <button onClick={() => navigate('/contacto')} className={`hover:text-primary transition-colors tracking-wide uppercase text-xs font-medium ${isActive('/contacto') ? 'text-primary' : 'text-zinc-500'}`}>Contacto</button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 lg:gap-2">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop actions */}
            {user && isAdmin && (
              <button onClick={() => navigate('/admin')} className="hidden lg:flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-body text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                <Shield className="h-3.5 w-3.5" />Admin
              </button>
            )}
            {user ? (
              <button onClick={signOut} className="hidden lg:flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-body text-xs text-zinc-300 hover:border-red-500/50 hover:text-red-400 transition-colors">
                <LogOut className="h-3.5 w-3.5" />Salir
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="hidden lg:flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-body text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                <User className="h-3.5 w-3.5" />Ingresar
              </button>
            )}

            {/* Cart */}
            <button onClick={() => setIsOpen(true)} className="relative flex items-center gap-1.5 lg:gap-2 rounded bg-primary px-3 lg:px-4 py-2 font-body text-xs font-semibold text-white hover:bg-primary/85 tracking-wide uppercase transition-colors">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow">{totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950 shadow-xl lg:hidden">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {[
                { label: 'Productos', path: '/', icon: Home, highlight: false },
                { label: 'Promociones', path: '/promociones', icon: Zap, highlight: true },
                { label: 'Contacto', path: '/contacto', icon: MessageCircle, highlight: false },
              ].map(({ label, path, icon: Icon, highlight }) => (
                <button
                  key={path}
                  onClick={() => handleNav(path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm font-medium transition-colors ${
                    isActive(path)
                      ? highlight ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/15 text-primary'
                      : highlight ? 'text-amber-500 hover:bg-amber-500/10' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {highlight && <Zap className="ml-auto h-3 w-3 text-amber-400" />}
                </button>
              ))}

              <div className="border-t border-zinc-800 pt-2 mt-1 space-y-1">
                {user && isAdmin && (
                  <button onClick={() => handleNav('/admin')} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                    <Shield className="h-4 w-4 text-primary" />Admin Panel
                  </button>
                )}
                {user ? (
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm text-red-400 hover:bg-zinc-800 transition-colors">
                    <LogOut className="h-4 w-4" />Cerrar sesión
                  </button>
                ) : (
                  <button onClick={() => handleNav('/auth')} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                    <User className="h-4 w-4" />Ingresar
                  </button>
                )}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-body text-sm text-green-400 hover:bg-zinc-800 transition-colors">
                  <Phone className="h-4 w-4" />WhatsApp
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default StoreHeader;
