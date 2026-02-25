import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const AdminUsers = () => {
  const [users, setUsers] = useState<(Profile & { role?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
      setUsers((profiles || []).map((p) => ({ ...p, role: roleMap.get(p.id) || 'user' })));
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AdminLayout>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Usuarios</h2>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">DNI</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">CUIL/CUIT</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dirección</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.dni || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.cuil_cuit || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.address || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
