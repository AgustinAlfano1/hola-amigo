import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface ParsedProduct {
  name: string;
  price: number;
  brand?: string;
  category?: string;
  description?: string;
  original_price?: number | null;
  stock_quantity?: number;
  codigo?: string;
  is_new?: boolean;
  is_featured?: boolean;
  image_url?: string;
}

interface ImportResult {
  total: number;
  success: number;
  errors: { row: number; name: string; error: string }[];
}

const REQUIRED_COLUMNS = ['name', 'price'];
const OPTIONAL_COLUMNS = ['brand', 'category', 'description', 'original_price', 'stock_quantity', 'codigo', 'is_new', 'is_featured', 'image_url'];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',' || ch === ';') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function mapRow(headers: string[], row: string[]): ParsedProduct | null {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] || '';
  });

  const name = obj['name'] || obj['nombre'] || '';
  const priceStr = (obj['price'] || obj['precio'] || '').replace(/[^0-9.,]/g, '').replace(',', '.');
  const price = parseFloat(priceStr);

  if (!name || isNaN(price) || price <= 0) return null;

  const parseBool = (val: string | undefined): boolean | undefined => {
    if (!val) return undefined;
    const v = val.toLowerCase().trim();
    if (['true', 'si', 'sí', '1', 'yes'].includes(v)) return true;
    if (['false', 'no', '0'].includes(v)) return false;
    return undefined;
  };

  const origPriceStr = (obj['original_price'] || obj['precio_original'] || '').replace(/[^0-9.,]/g, '').replace(',', '.');
  const origPrice = parseFloat(origPriceStr);

  const stockStr = (obj['stock_quantity'] || obj['stock'] || obj['cantidad_stock'] || '').replace(/[^0-9]/g, '');
  const stockQty = stockStr ? parseInt(stockStr) : 0;

  return {
    name,
    price,
    brand: obj['brand'] || obj['marca'] || undefined,
    category: obj['category'] || obj['categoria'] || obj['categoría'] || undefined,
    description: obj['description'] || obj['descripcion'] || obj['descripción'] || undefined,
    original_price: isNaN(origPrice) ? null : origPrice,
    stock_quantity: stockQty,
    codigo: (obj['codigo'] || obj['código'] || obj['code'] || '').substring(0, 50) || undefined,
    is_new: parseBool(obj['is_new'] || obj['nuevo']) ?? false,
    is_featured: parseBool(obj['is_featured'] || obj['destacado']) ?? false,
    image_url: obj['image_url'] || obj['imagen'] || undefined,
  };
}

const SAMPLE_CSV = `name,price,brand,category,description,original_price,stock_quantity,codigo,is_new,is_featured
"Filtro de aceite Fiat Uno",12500,Fiat,Filtros,"Compatible con Uno 2010-2020",15000,25,FLT-001,false,false
"Pastillas de freno Palio",8900,Fiat,Frenos,"Juego delantero",10500,10,FRN-002,true,false
"Correa de distribución Siena",22000,Fiat,Motor,"Kit completo con tensor",,5,MTR-003,false,true
"Amortiguador trasero Cronos",35000,Fiat,Suspensión,"Par de amortiguadores",42000,8,SUS-004,true,true
"Bujía NGK Punto",3200,Fiat,Encendido,"Pack x4 bujías",,50,ENC-005,false,false`;

const AdminImportCSV = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      toast({ title: 'Formato no soportado', description: 'Solo se aceptan archivos .csv o .txt', variant: 'destructive' });
      return;
    }

    setFile(f);
    setResult(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (ev) => {
      let text = ev.target?.result as string;
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const { headers, rows } = parseCSV(text);

      console.log('CSV headers:', headers);
      console.log('CSV rows count:', rows.length);

      const hasName = headers.some((h) => ['name', 'nombre'].includes(h));
      const hasPrice = headers.some((h) => ['price', 'precio'].includes(h));

      if (!hasName || !hasPrice) {
        toast({
          title: 'Columnas faltantes',
          description: `Encabezados encontrados: ${headers.join(', ')}. Se requiere "name" (o "nombre") y "price" (o "precio").`,
          variant: 'destructive',
        });
        setFile(null);
        return;
      }

      const products: ParsedProduct[] = [];
      const invalid: number[] = [];

      rows.forEach((row, i) => {
        const p = mapRow(headers, row);
        if (p) products.push(p);
        else {
          invalid.push(i + 2);
          console.log(`Row ${i + 2} invalid:`, row);
        }
      });

      setPreview(products);
      setInvalidRows(invalid);
    };
    reader.readAsText(f, 'UTF-8');
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    setProgress(0);

    const BATCH_SIZE = 50;
    const errors: ImportResult['errors'] = [];
    let success = 0;

    for (let i = 0; i < preview.length; i += BATCH_SIZE) {
      const batch = preview.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').insert(
        batch.map((p) => ({
          name: p.name,
          price: p.price,
          brand: p.brand || null,
          category: p.category || null,
          description: p.description || null,
          original_price: p.original_price || null,
          stock_quantity: p.stock_quantity ?? 0,
          codigo: p.codigo || null,
          in_stock: (p.stock_quantity ?? 0) > 0,
          is_new: p.is_new ?? false,
          is_featured: p.is_featured ?? false,
          image_url: p.image_url || null,
        }))
      );

      if (error) {
        batch.forEach((p, j) => {
          errors.push({ row: i + j + 2, name: p.name, error: error.message });
        });
      } else {
        success += batch.length;
      }

      setProgress(Math.round(((i + batch.length) / preview.length) * 100));
    }

    const importResult: ImportResult = { total: preview.length, success, errors };
    setResult(importResult);
    setImporting(false);

    if (errors.length === 0) {
      toast({ title: '¡Importación exitosa!', description: `${success} productos importados correctamente.` });
    } else {
      toast({
        title: 'Importación con errores',
        description: `${success} importados, ${errors.length} con errores.`,
        variant: 'destructive',
      });
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos-ejemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setInvalidRows([]);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Importar productos por CSV</h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Cargá un archivo CSV o TXT con tus productos para importarlos masivamente.
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="font-heading text-base font-semibold text-card-foreground mb-3">📋 Formato del archivo</h3>
        <div className="grid gap-2 font-body text-sm text-muted-foreground">
          <p>
            <strong className="text-card-foreground">Columnas obligatorias:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">name</code> (o <code className="rounded bg-muted px-1.5 py-0.5 text-xs">nombre</code>), <code className="rounded bg-muted px-1.5 py-0.5 text-xs">price</code> (o <code className="rounded bg-muted px-1.5 py-0.5 text-xs">precio</code>)
          </p>
          <p>
            <strong className="text-card-foreground">Columnas opcionales:</strong> brand/marca, category/categoría, description/descripción, original_price/precio_original, stock_quantity/stock/cantidad_stock, codigo/código/code, is_new/nuevo, is_featured/destacado, image_url/imagen
          </p>
          <p>Separador: <strong className="text-card-foreground">coma (,) o punto y coma (;)</strong>. Los booleanos aceptan: true/false, si/no, 1/0.</p>
        </div>
        <button
          onClick={downloadSample}
          className="mt-3 flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
          Descargar CSV de ejemplo
        </button>
      </div>

      {/* Upload area */}
      {!file && !result && (
        <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-body text-base text-card-foreground mb-1">Arrastrá tu archivo o hacé clic para seleccionar</p>
          <p className="font-body text-sm text-muted-foreground mb-4">Formatos aceptados: .csv, .txt</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-primary px-6 py-2.5 font-body text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Seleccionar archivo
          </button>
        </div>
      )}

      {/* Preview */}
      {file && !result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-body text-sm font-medium text-card-foreground">{file.name}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {preview.length} productos válidos
                  {invalidRows.length > 0 && ` · ${invalidRows.length} filas con errores`}
                </p>
              </div>
            </div>
            <button onClick={reset} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {invalidRows.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="font-body text-sm font-medium text-destructive">Filas con errores (se omitirán)</p>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                Filas: {invalidRows.slice(0, 20).join(', ')}{invalidRows.length > 20 ? `... y ${invalidRows.length - 20} más` : ''}
              </p>
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="overflow-auto rounded-xl border border-border bg-card max-h-80">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 sticky top-0">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Código</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Marca</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Categoría</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Precio</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 100).map((p, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{p.codigo || '—'}</td>
                        <td className="px-3 py-2 text-card-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.brand || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.category || '—'}</td>
                        <td className="px-3 py-2 text-right text-card-foreground">${p.price.toLocaleString('es-AR')}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-body text-sm font-medium ${(p.stock_quantity ?? 0) > 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {p.stock_quantity ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 100 && (
                  <p className="px-3 py-2 text-center font-body text-xs text-muted-foreground border-t border-border">
                    Mostrando 100 de {preview.length} productos
                  </p>
                )}
              </div>

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="font-body text-xs text-muted-foreground text-center">Importando... {progress}%</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={reset} className="rounded-lg border border-border px-4 py-2 font-body text-sm hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-body text-sm text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {importing ? 'Importando...' : `Importar ${preview.length} productos`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            {result.errors.length === 0 ? (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-heading text-lg font-semibold text-card-foreground">¡Importación completada!</h3>
                <p className="font-body text-sm text-muted-foreground mt-1">{result.success} productos importados correctamente.</p>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-3" />
                <h3 className="font-heading text-lg font-semibold text-card-foreground">Importación con errores</h3>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {result.success} importados · {result.errors.length} con errores
                </p>
              </>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="overflow-auto rounded-xl border border-border bg-card max-h-48">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fila</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Producto</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.slice(0, 50).map((err, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-muted-foreground">{err.row}</td>
                      <td className="px-3 py-2 text-card-foreground">{err.name}</td>
                      <td className="px-3 py-2 text-destructive text-xs">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={reset} className="rounded-lg bg-primary px-6 py-2 font-body text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminImportCSV;
