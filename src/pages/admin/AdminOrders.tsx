import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Order = Tables<'orders'>;

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

const AdminOrders = () => {
  const [orders, setOrders] = useState<(Order & { profile_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map((o) => o.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
      setOrders(data.map((o) => ({ ...o, profile_name: profileMap.get(o.user_id) || 'Desconocido' })));
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

    // Send email notification for shipped/delivered
    if (status === 'shipped' || status === 'delivered') {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/send-order-status-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order_id: id, status }),
          }
        );
        if (res.ok) {
          toast({ title: `📧 Email de "${statusLabels[status]}" enviado al cliente` });
        } else {
          console.error('Email send failed:', await res.text());
        }
      } catch (e) {
        console.error('Error sending status email:', e);
      }
    }
  };

  return (
    <AdminLayout>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Pedidos</h2>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : orders.length === 0 ? (
        <p className="py-12 text-center font-body text-muted-foreground">No hay pedidos todavía</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-card-foreground">{o.profile_name}</td>
                  <td className="px-4 py-3 text-right font-medium text-card-foreground">${Number(o.total_amount).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[o.status] || 'bg-muted text-muted-foreground'}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1 font-body text-xs"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
