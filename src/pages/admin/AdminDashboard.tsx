import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Package, ShoppingBag, Users, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const AdminDashboard = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  useEffect(() => {
    const fetchStats = async () => {
      // Fechas del mes seleccionado
      const from = new Date(selectedYear, selectedMonth, 1).toISOString();
      const to = new Date(selectedYear, selectedMonth + 1, 1).toISOString();

      const [productsRes, activeOrdersRes, usersRes, revenueRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .not('status', 'in', '(delivered,cancelled)'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        // Ingresos: solo pedidos entregados en el mes seleccionado
        supabase.from('orders').select('total_amount')
          .eq('status', 'delivered')
          .gte('created_at', from)
          .lt('created_at', to),
      ]);

      const revenue = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        products: productsRes.count || 0,
        orders: activeOrdersRes.count || 0,
        users: usersRes.count || 0,
        revenue,
      });
    };
    fetchStats();
  }, [selectedMonth, selectedYear]);

  return (
    <AdminLayout>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Productos */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-muted-foreground">Productos</p>
              <p className="mt-1 font-heading text-2xl font-bold text-card-foreground">{stats.products}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Pedidos activos */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-muted-foreground">Pedidos activos</p>
              <p className="mt-1 font-heading text-2xl font-bold text-card-foreground">{stats.orders}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Usuarios */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-muted-foreground">Usuarios</p>
              <p className="mt-1 font-heading text-2xl font-bold text-card-foreground">{stats.users}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Ingresos mensuales */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-body text-sm text-muted-foreground">Ingresos</p>
              <p className="mt-1 font-heading text-2xl font-bold text-card-foreground">{formatPrice(stats.revenue)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          {/* Selector de mes */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <button onClick={prevMonth} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-body text-xs text-muted-foreground text-center">
              {MONTHS[selectedMonth]} {selectedYear}
              {isCurrentMonth && <span className="ml-1 text-primary">●</span>}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
