import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Upload, CheckCircle2, XCircle, AlertCircle, ImagePlus, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

type ImageMatch = {
  file: File;
  preview: string;
  matchedProduct: Product | null;
  status: 'pending' | 'uploading' | 'done' | 'error';
  overrideProductId?: string;
};

const normalize = (str: string) =>
  str.toUpperCase()
    .replace(/[./\\()\[\]{}]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const similarity = (a: string, b: string) => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  const common = wordsA.filter(w => w.length > 2 && wordsB.includes(w));
  return common.length / Math.max(wordsA.length, wordsB.length);
};

const AdminImportImages = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [matches, setMatches] = useState<ImageMatch[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadProducts = async () => {
    setLoadingProducts(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setLoadingProducts(false);
    return data || [];
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let prods = products;
    if (!prods.length) {
      prods = await loadProducts();
      setProducts(prods);
    }

    const newMatches: ImageMatch[] = files.map(file => {
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      const scored = prods.map(p => ({
        product: p,
        score: similarity(nameWithoutExt, p.name),
      })).sort((a, b) => b.score - a.score);

      const best = scored[0];
      return {
        file,
        preview: URL.createObjectURL(file),
        matchedProduct: best && best.score >= 0.4 ? best.product : null,
        status: 'pending' as const,
      };
    });

    setMatches(newMatches);
  };

  const handleOverride = (idx: number, productId: string) => {
    setMatches(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const product = products.find(p => p.id === productId) || null;
      return { ...m, matchedProduct: product, overrideProductId: productId };
    }));
  };

  const handleUploadAll = async () => {
    const toUpload = matches.filter(m => m.matchedProduct && m.status === 'pending');
    if (!toUpload.length) {
      toast({ title: 'No hay imágenes para subir', description: 'Asegurate de tener matches válidos.', variant: 'destructive' });
      return;
    }

    setUploading(true);

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (!match.matchedProduct || match.status !== 'pending') continue;

      setMatches(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'uploading' } : m));

      try {
        const ext = match.file.name.split('.').pop();
        const fileName = `${match.matchedProduct.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, match.file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: urlData.publicUrl })
          .eq('id', match.matchedProduct.id);

        if (updateError) throw updateError;

        setMatches(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'done' } : m));
      } catch (err: any) {
        setMatches(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'error' } : m));
      }
    }

    setUploading(false);
    const done = matches.filter(m => m.status === 'done').length;
    toast({ title: `✅ ${toUpload.length} imágenes procesadas` });
  };

  const matched = matches.filter(m => m.matchedProduct).length;
  const unmatched = matches.filter(m => !m.matchedProduct).length;
  const done = matches.filter(m => m.status === 'done').length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Importar Imágenes</h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Seleccioná múltiples imágenes. El sistema las matchea automáticamente por nombre de producto.
        </p>
      </div>

      {/* Instrucciones */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="font-heading text-xs font-bold tracking-widest text-primary mb-2">CONVENCIÓN DE NOMBRES</p>
        <p className="font-body text-sm text-muted-foreground">
          Nombrá los archivos igual (o similar) al nombre del producto. Ejemplos:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['AMORT PAL SIENA DEL COFAP.jpg', 'KIT DISTRIBUCION FIRE FIJA.png', 'ACEITE 5-30 4L MOPAR.webp'].map(ex => (
            <code key={ex} className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">{ex}</code>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />

      {matches.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loadingProducts}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-16 transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
        >
          {loadingProducts ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="font-heading text-sm font-bold tracking-wider text-foreground">
              {loadingProducts ? 'Cargando productos...' : 'Seleccionar imágenes'}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">Podés seleccionar todas a la vez</p>
          </div>
        </button>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 font-body text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium text-foreground">{matched}</span>
                <span className="text-muted-foreground">matcheados</span>
              </span>
              <span className="flex items-center gap-1.5 font-body text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-foreground">{unmatched}</span>
                <span className="text-muted-foreground">sin match</span>
              </span>
              {done > 0 && (
                <span className="flex items-center gap-1.5 font-body text-sm">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{done}</span>
                  <span className="text-muted-foreground">subidos</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setMatches([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="rounded-lg border border-border px-4 py-2 font-body text-sm hover:bg-muted transition-colors"
                disabled={uploading}
              >
                Limpiar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-border px-4 py-2 font-body text-sm hover:bg-muted transition-colors"
                disabled={uploading}
              >
                + Agregar más
              </button>
              <button
                onClick={handleUploadAll}
                disabled={uploading || matched === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-white hover:bg-primary/85 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Subiendo...' : `Subir ${matched} imágenes`}
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match, idx) => (
              <div key={idx} className={`rounded-xl border bg-card overflow-hidden transition-all ${
                match.status === 'done' ? 'border-green-500/30 bg-green-500/5' :
                match.status === 'error' ? 'border-destructive/30' :
                match.matchedProduct ? 'border-border' : 'border-yellow-500/30 bg-yellow-500/5'
              }`}>
                {/* Image */}
                <div className="relative h-36 bg-zinc-100 overflow-hidden">
                  <img src={match.preview} alt="" className="h-full w-full object-cover" />
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {match.status === 'done' && <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 font-body text-[10px] font-bold text-white">✓ Subido</span>}
                    {match.status === 'uploading' && <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-body text-[10px] font-bold text-white"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Subiendo</span>}
                    {match.status === 'error' && <span className="flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 font-body text-[10px] font-bold text-white">✗ Error</span>}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-mono text-[11px] text-muted-foreground truncate mb-2">{match.file.name}</p>

                  {match.matchedProduct ? (
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" />
                      <p className="font-body text-xs font-medium text-foreground leading-tight">{match.matchedProduct.name}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-yellow-500 mt-0.5" />
                      <p className="font-body text-xs text-yellow-600">Sin match automático</p>
                    </div>
                  )}

                  {/* Manual override */}
                  {match.status === 'pending' && (
                    <div className="mt-2 relative">
                      <select
                        value={match.matchedProduct?.id || ''}
                        onChange={(e) => handleOverride(idx, e.target.value)}
                        className="w-full rounded border border-input bg-background px-2 py-1.5 font-body text-xs text-muted-foreground appearance-none pr-6 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">— Asignar manualmente —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminImportImages;
