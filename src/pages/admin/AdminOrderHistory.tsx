import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ChevronDown, ChevronUp, Package, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const statusLabels: Record<string, string> = {
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface OrderItem {
  product_name: string;
  product_brand: string | null;
  quantity: number;
  price_at_purchase: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  billing_name: string | null;
  billing_dni_cuit: string | null;
  invoice_type: string | null;
  delivery_type: string | null;
  shipping_address: string | null;
  shipping_postal_code: string | null;
  shipping_cost: number | null;
  items?: OrderItem[];
}

const AdminOrderHistory = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const from = new Date(selectedYear, selectedMonth, 1).toISOString();
    const to = new Date(selectedYear, selectedMonth + 1, 1).toISOString();
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['delivered', 'cancelled'])
      .gte('created_at', from)
      .lt('created_at', to)
      .order('created_at', { ascending: false });

    if (data) {
      const ordersWithItems = await Promise.all(
        data.map(async (o) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('product_name, product_brand, quantity, price_at_purchase')
            .eq('order_id', o.id);
          return { ...o, items: items || [] };
        })
      );
      setOrders(ordersWithItems);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [selectedMonth, selectedYear]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    // Borrar items primero
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Pedido eliminado' });
      setOrders(prev => prev.filter(o => o.id !== id));
    }
    setDeleting(null);
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Ingresos</h2>
          <p className="font-body text-sm text-muted-foreground">Historial de pedidos entregados y cancelados</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-3 text-right">
          {/* Selector de mes */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <button onClick={prevMonth} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-body text-xs text-muted-foreground whitespace-nowrap">
              {MONTHS[selectedMonth]} {selectedYear}
              {isCurrentMonth && <span className="ml-1 text-primary">●</span>}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="font-body text-xs text-muted-foreground">Total entregado</p>
          <p className="font-heading text-xl font-bold text-foreground">
            {formatPrice(orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total_amount), 0))}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-12 text-center font-body text-muted-foreground">No hay pedidos en el historial</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-sm font-semibold text-card-foreground">
                      {o.billing_name || 'Cliente desconocido'}
                    </span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[o.status] || 'bg-muted text-muted-foreground'}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    {new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{o.items?.length || 0} producto{(o.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-heading text-base font-bold text-card-foreground whitespace-nowrap">
                  {formatPrice(Number(o.total_amount))}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }}
                  disabled={deleting === o.id}
                  className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {expanded === o.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>

              {/* Detalle expandido */}
              {expanded === o.id && (
                <div className="border-t border-border px-4 py-4 grid md:grid-cols-2 gap-4 bg-muted/20">
                  <div>
                    <h4 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Facturación</h4>
                    <div className="space-y-1 font-body text-sm">
                      {o.billing_name && <p><span className="text-muted-foreground">Nombre:</span> {o.billing_name}</p>}
                      {o.billing_dni_cuit && <p><span className="text-muted-foreground">DNI/CUIT:</span> {o.billing_dni_cuit}</p>}
                      <p><span className="text-muted-foreground">Tipo:</span> {o.invoice_type === 'factura_a' ? '🧾 Factura A' : '🧾 Consumidor Final'}</p>
                    </div>

                    <h4 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 mt-4">Entrega</h4>
                    <div className="space-y-1 font-body text-sm">
                      <p><span className="text-muted-foreground">Tipo:</span> {o.delivery_type === 'shipping' ? '🚚 Envío a domicilio' : '🏪 Retiro en local'}</p>
                      {o.delivery_type === 'shipping' && (
                        <>
                          {o.shipping_address && <p><span className="text-muted-foreground">Dirección:</span> {o.shipping_address}</p>}
                          {o.shipping_postal_code && <p><span className="text-muted-foreground">CP:</span> {o.shipping_postal_code}</p>}
                          {o.shipping_cost != null && o.shipping_cost > 0 && (
                            <p><span className="text-muted-foreground">Costo envío:</span> {formatPrice(Number(o.shipping_cost))}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Productos</h4>
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

export default AdminOrderHistory;
