import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface OrderItem {
  product_name: string;
  product_brand: string | null;
  quantity: number;
  price_at_purchase: number;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  dni: string | null;
  cuil_cuit: string | null;
  address: string | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id: string;
  profile?: Profile;
  items?: OrderItem[];
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((o) => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, dni, cuil_cuit, address')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const ordersWithItems = await Promise.all(
        data.map(async (o) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('product_name, product_brand, quantity, price_at_purchase')
            .eq('order_id', o.id);
          return {
            ...o,
            profile: profileMap.get(o.user_id) || null,
            items: items || [],
          };
        })
      );

      setOrders(ordersWithItems);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Estado actualizado a "${statusLabels[status]}"` });
    fetchOrders();

    // Enviar email para todos los cambios de estado
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-order-status-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ order_id: id, status }),
        }
      );
      if (res.ok) toast({ title: `📧 Email de "${statusLabels[status]}" enviado al cliente` });
    } catch (e) {
      console.error('Error sending status email:', e);
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  return (
    <AdminLayout>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Pedidos</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-12 text-center font-body text-muted-foreground">No hay pedidos todavía</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-sm font-semibold text-card-foreground">
                      {o.profile?.full_name || 'Cliente desconocido'}
                    </span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[o.status] || 'bg-muted text-muted-foreground'}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    {new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {o.items?.length || 0} producto{(o.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-heading text-base font-bold text-card-foreground whitespace-nowrap">
                  {formatPrice(Number(o.total_amount))}
                </span>
                <select
                  value={o.status}
                  onChange={(e) => { e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg border border-input bg-background px-2 py-1 font-body text-xs"
                >
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {expanded === o.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>

              {/* Expanded detail */}
              {expanded === o.id && (
                <div className="border-t border-border px-4 py-4 grid md:grid-cols-2 gap-4 bg-muted/20">
                  {/* Datos del cliente */}
                  <div>
                    <h4 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Datos del cliente</h4>
                    <div className="space-y-1 font-body text-sm">
                      {o.profile?.full_name && <p><span className="text-muted-foreground">Nombre:</span> {o.profile.full_name}</p>}
                      {o.profile?.phone && <p><span className="text-muted-foreground">Teléfono:</span> {o.profile.phone}</p>}
                      {o.profile?.dni && <p><span className="text-muted-foreground">DNI:</span> {o.profile.dni}</p>}
                      {o.profile?.cuil_cuit && <p><span className="text-muted-foreground">CUIL/CUIT:</span> {o.profile.cuil_cuit}</p>}
                      {o.profile?.address && <p><span className="text-muted-foreground">Dirección:</span> {o.profile.address}</p>}
                      {!o.profile?.phone && !o.profile?.dni && !o.profile?.address && (
                        <p className="text-muted-foreground italic text-xs">Sin datos adicionales cargados</p>
                      )}
                    </div>
                  </div>

                  {/* Productos */}
                  <div>
                    <h4 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Productos del pedido</h4>
                    <div className="space-y-1.5">
                      {(o.items || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-body text-sm flex-1">
                            <span className="font-medium">{item.quantity}x</span> {item.product_name}
                            {item.product_brand && <span className="text-muted-foreground"> ({item.product_brand})</span>}
                          </span>
                          <span className="font-body text-sm font-medium whitespace-nowrap">
                            {formatPrice(Number(item.price_at_purchase) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
