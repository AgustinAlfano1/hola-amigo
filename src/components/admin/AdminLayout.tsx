import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Package, ShoppingBag, Users, LayoutDashboard, LogOut, ArrowLeft, FileUp, Images, Zap, Menu, X, Truck } from 'lucide-react';
import NotificationsBell from '@/components/admin/NotificationsBell';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Productos', icon: Package, path: '/admin/products' },
  { label: 'Promociones', icon: Zap, path: '/admin/promotions' },
  { label: 'Pedidos', icon: ShoppingBag, path: '/admin/orders' },
  { label: 'Usuarios', icon: Users, path: '/admin/users' },
  { label: 'Importar CSV', icon: FileUp, path: '/admin/import' },
  { label: 'Importar Imágenes', icon: Images, path: '/admin/import-images' },
  { label: 'Tarifas de envío', icon: Truck, path: '/admin/shipping' },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="font-heading text-xl text-foreground">Acceso denegado</p>
        <button onClick={() => navigate('/')} className="rounded-lg bg-primary px-4 py-2 text-sm font-body text-primary-foreground hover:bg-primary/90">
          Volver a la tienda
        </button>
      </div>
    );
  }

  const currentLabel = navItems.find(i => i.pathname === location.pathname)?.label
    || navItems.find(i => i.path === location.pathname)?.label
    || 'Admin';

  const handleNav = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const isPromo = item.path === '/admin/promotions';
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                active
                  ? isPromo ? 'bg-amber-500 text-white' : 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : isPromo ? 'text-amber-500 hover:bg-amber-500/10' : 'text-primary hover:bg-sidebar-accent hover:text-primary'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        <button onClick={() => handleNav('/')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm text-primary transition-colors hover:bg-sidebar-accent">
          <ArrowLeft className="h-4 w-4" /> Volver a la tienda
        </button>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm text-primary transition-colors hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* DESKTOP sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <LayoutDashboard className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold tracking-wider">Admin Panel</span>
          </div>
          <NotificationsBell />
        </div>
        <SidebarContent />
      </aside>

      {/* MOBILE overlay sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-2xl lg:hidden">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
              <span className="font-heading text-base font-bold tracking-wider text-sidebar-foreground">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-sidebar-foreground hover:bg-sidebar-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* MOBILE top bar */}
        <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-heading text-sm font-bold tracking-wider text-foreground">
            {navItems.find(i => i.path === location.pathname)?.label || 'Admin'}
          </span>
          <NotificationsBell />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
