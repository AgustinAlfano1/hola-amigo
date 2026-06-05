import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Package, ShoppingBag, Users, LayoutDashboard, LogOut, ArrowLeft, FileUp, Images, Zap } from 'lucide-react';
import NotificationsBell from '@/components/admin/NotificationsBell';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Productos', icon: Package, path: '/admin/products' },
  { label: 'Promociones', icon: Zap, path: '/admin/promotions' },
  { label: 'Pedidos', icon: ShoppingBag, path: '/admin/orders' },
  { label: 'Usuarios', icon: Users, path: '/admin/users' },
  { label: 'Importar CSV', icon: FileUp, path: '/admin/import' },
  { label: 'Importar Imágenes', icon: Images, path: '/admin/import-images' },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, loading } = useAdminCheck();

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
        <p className="font-body text-muted-foreground">No tenés permisos de administrador.</p>
        <button onClick={() => navigate('/')} className="rounded-lg bg-primary px-4 py-2 text-sm font-body text-primary-foreground hover:bg-primary/90">
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <LayoutDashboard className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold tracking-wider">Admin Panel</span>
          </div>
          <NotificationsBell />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const isPromo = item.path === '/admin/promotions';
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                  active
                    ? isPromo ? 'bg-amber-500 text-white' : 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : isPromo ? 'text-amber-500 hover:bg-amber-500/10' : 'text-primary hover:bg-sidebar-accent hover:text-primary'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <button onClick={() => navigate('/')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm text-primary transition-colors hover:bg-sidebar-accent hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver a la tienda
          </button>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm text-primary transition-colors hover:bg-sidebar-accent hover:text-primary">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
