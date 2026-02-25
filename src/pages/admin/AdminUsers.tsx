import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Profile = Tables<'profiles'>;

const AdminUsers = () => {
  const [users, setUsers] = useState<(Profile & { role?: string; roleId?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('id, user_id, role');
    const roleMap = new Map((roles || []).map((r) => [r.user_id, { role: r.role, id: r.id }]));
    setUsers((profiles || []).map((p) => {
      const r = roleMap.get(p.id);
      return { ...p, role: r?.role || 'user', roleId: r?.id };
    }));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (userId: string, currentRole: string, roleId?: string) => {
    setToggling(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (roleId) {
      const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', roleId);
      if (error) { toast.error('Error al cambiar rol'); setToggling(null); return; }
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) { toast.error('Error al cambiar rol'); setToggling(null); return; }
    }
    toast.success(`Rol cambiado a ${newRole === 'admin' ? 'Admin' : 'Usuario'}`);
    await fetchUsers();
    setToggling(null);
  };

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
                    <button
                      disabled={toggling === u.id}
                      onClick={() => toggleRole(u.id, u.role || 'user', u.roleId)}
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50 ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                      title="Click para cambiar rol"
                    >
                      {toggling === u.id ? '...' : u.role === 'admin' ? 'Admin' : 'Usuario'}
                    </button>
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
