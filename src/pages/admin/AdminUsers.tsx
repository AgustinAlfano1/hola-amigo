import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Pencil, X, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Profile = Tables<'profiles'>;
type UserRow = Profile & { role?: string; roleId?: string };

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', dni: '', cuil_cuit: '', address: '' });

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('id, user_id, role');
    const roleMap = new Map((roles || []).map(r => [r.user_id, { role: r.role, id: r.id }]));
    setUsers((profiles || []).map(p => {
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
      await supabase.from('user_roles').update({ role: newRole }).eq('id', roleId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
    }
    toast.success(`Rol cambiado a ${newRole === 'admin' ? 'Admin' : 'Usuario'}`);
    await fetchUsers();
    setToggling(null);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setForm({ full_name: user.full_name || '', phone: user.phone || '', dni: user.dni || '', cuil_cuit: user.cuil_cuit || '', address: user.address || '' });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', editing.id);
    if (error) toast.error('Error al guardar');
    else { toast.success('Datos actualizados'); setEditing(null); fetchUsers(); }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <h2 className="font-heading text-xl font-bold text-foreground mb-4">Usuarios</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* MOBILE card list */}
          <div className="space-y-2 lg:hidden">
            {users.map(u => (
              <div key={u.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-body text-sm font-medium text-foreground">{u.full_name || '(sin nombre)'}</p>
                    <button
                      disabled={toggling === u.id}
                      onClick={() => toggleRole(u.id, u.role || 'user', u.roleId)}
                      className={`rounded-full px-2 py-0.5 font-body text-[10px] font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                    >
                      {toggling === u.id ? '...' : u.role === 'admin' ? 'Admin' : 'Usuario'}
                    </button>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">📞 {u.phone || '—'}</p>
                  <p className="font-body text-xs text-muted-foreground">🪪 {u.dni || '—'} · {u.cuil_cuit || '—'}</p>
                  <p className="font-body text-xs text-muted-foreground">📍 {u.address || '—'}</p>
                  <p className="font-body text-xs text-muted-foreground">📅 {new Date(u.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-12 text-center font-body text-sm text-muted-foreground">No hay usuarios registrados</p>
            )}
          </div>

          {/* DESKTOP table */}
          <div className="hidden lg:block overflow-auto rounded-xl border border-border bg-card">
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
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.dni || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.cuil_cuit || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{u.address || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={toggling === u.id}
                        onClick={() => toggleRole(u.id, u.role || 'user', u.roleId)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50 ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                      >
                        {toggling === u.id ? '...' : u.role === 'admin' ? 'Admin' : 'Usuario'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay usuarios registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {[
              { label: 'Nombre completo', key: 'full_name', placeholder: 'Juan Pérez' },
              { label: 'Teléfono', key: 'phone', placeholder: '+54 11 1234-5678' },
              { label: 'DNI', key: 'dni', placeholder: '12345678' },
              { label: 'CUIL/CUIT', key: 'cuil_cuit', placeholder: '20-12345678-9' },
              { label: 'Dirección', key: 'address', placeholder: 'Av. Corrientes 1234' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="font-body text-sm text-muted-foreground">{label}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-body text-sm hover:bg-muted transition-colors">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-white hover:bg-primary/85 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
