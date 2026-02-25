import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Package, ShoppingBag, Users, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const revenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        products: productsRes.count || 0,
        orders: (ordersRes.data || []).length,
        users: usersRes.count || 0,
        revenue,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Productos', value: stats.products, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: 'Pedidos', value: stats.orders, icon: ShoppingBag, color: 'bg-accent/10 text-accent' },
    { label: 'Usuarios', value: stats.users, icon: Users, color: 'bg-secondary text-secondary-foreground' },
    { label: 'Ingresos', value: `$${stats.revenue.toLocaleString('es-AR')}`, icon: DollarSign, color: 'bg-primary/10 text-primary' },
  ];

  return (
    <AdminLayout>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-heading text-2xl font-bold text-card-foreground">{c.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
