import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Upload, X } from 'lucide-react';

interface ShippingRate {
  id: string;
  postal_code: string;
  zone_name: string | null;
  cost: number;
}

const AdminShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newRate, setNewRate] = useState({ postal_code: '', zone_name: '', cost: '' });
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchRates = async () => {
    setLoading(true);
    const { data } = await supabase.from('shipping_rates').select('*').order('postal_code');
    if (data) setRates(data as ShippingRate[]);
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const addRate = async () => {
    if (!newRate.postal_code.trim() || !newRate.cost) {
      toast({ title: 'Código postal y costo son obligatorios', variant: 'destructive' });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('shipping_rates').upsert({
      postal_code: newRate.postal_code.trim(),
      zone_name: newRate.zone_name.trim() || null,
      cost: Number(newRate.cost),
    }, { onConflict: 'postal_code' });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tarifa guardada' });
      setNewRate({ postal_code: '', zone_name: '', cost: '' });
      fetchRates();
    }
    setAdding(false);
  };

  const deleteRate = async (id: string) => {
    const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Tarifa eliminada' });
    setRates(prev => prev.filter(r => r.id !== id));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const separator = text.includes(';') ? ';' : ',';

    // Detectar si tiene header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('postal') || firstLine.includes('codigo') || firstLine.includes('cp');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const toUpsert = dataLines
      .map(line => {
        const cols = line.trim().split(separator).map(c => c.trim().replace(/"/g, ''));
        const postal_code = cols[0];
        const zone_name = cols.length >= 3 ? cols[1] : null;
        const cost = cols.length >= 3 ? Number(cols[2]) : Number(cols[1]);
        if (!postal_code || isNaN(cost)) return null;
        return { postal_code, zone_name: zone_name || null, cost };
      })
      .filter(Boolean);

    if (toUpsert.length === 0) {
      toast({ title: 'No se encontraron datos válidos en el archivo', variant: 'destructive' });
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const { error } = await supabase
      .from('shipping_rates')
      .upsert(toUpsert as any, { onConflict: 'postal_code' });
    if (error) {
      toast({ title: 'Error al importar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${toUpsert.length} tarifas importadas correctamente` });
      fetchRates();
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const filtered = rates.filter(r =>
    r.postal_code.includes(search) || (r.zone_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Tarifas de envío</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-body text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Importando...' : 'Importar CSV'}
          </button>
        </div>
      </div>

      {/* Info formato CSV */}
      <div className="mb-4 rounded-lg bg-muted/50 border border-border p-3">
        <p className="font-body text-xs text-muted-foreground">
          <strong>Formato CSV:</strong> codigo_postal, zona (opcional), costo — separado por coma o punto y coma. Ej: <code>1708,Morón,1500</code> o <code>1708,1500</code>
        </p>
      </div>

      {/* Agregar nueva tarifa */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <h3 className="font-body text-sm font-semibold text-foreground mb-3">Agregar tarifa</h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Código postal *"
            value={newRate.postal_code}
            onChange={e => setNewRate(r => ({ ...r, postal_code: e.target.value }))}
            className="rounded-lg border border-input bg-background px-3 py-2 font-body text-sm w-36 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Zona / Localidad"
            value={newRate.zone_name}
            onChange={e => setNewRate(r => ({ ...r, zone_name: e.target.value }))}
            className="rounded-lg border border-input bg-background px-3 py-2 font-body text-sm flex-1 min-w-36 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Costo (ARS) *"
            value={newRate.cost}
            onChange={e => setNewRate(r => ({ ...r, cost: e.target.value }))}
            className="rounded-lg border border-input bg-background px-3 py-2 font-body text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={addRate}
            disabled={adding}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-white hover:bg-primary/85 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por código postal o zona..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center font-body text-sm text-muted-foreground">
          {search ? 'Sin resultados' : 'No hay tarifas cargadas. Importá un CSV o agregá una manualmente.'}
        </p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código postal</th>
                <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zona / Localidad</th>
                <th className="px-4 py-3 text-right font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Costo de envío</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-body text-sm font-semibold text-foreground">{r.postal_code}</td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.zone_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-body text-sm font-semibold text-foreground">{formatPrice(r.cost)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteRate(r.id)}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-muted/30 border-t border-border">
            <p className="font-body text-xs text-muted-foreground">{filtered.length} tarifas</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminShippingRates;
