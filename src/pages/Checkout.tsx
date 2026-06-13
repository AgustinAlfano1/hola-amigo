import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StoreHeader from '@/components/store/StoreHeader';
import { Loader2, Package, Truck, MapPin, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'shipping'>('pickup');
  const [shippingCost, setShippingCost] = useState(0);
  const [postalCodeStatus, setPostalCodeStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [paying, setPaying] = useState(false);
  const [cpSuggestions, setCpSuggestions] = useState<{ postal_code: string; zone_name: string | null; cost: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cpWrapperRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    billing_name: '',
    billing_dni_cuit: '',
    invoice_type: 'consumidor_final' as 'consumidor_final' | 'factura_a',
    address_street: '',
    address_number: '',
    address_between: '',
    address_city: '',
    postal_code: '',
    address_type: 'both' as 'billing_only' | 'both',
  });

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (items.length === 0) { navigate('/'); return; }
  }, [user, items]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cpWrapperRef.current && !cpWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar tarifa por código postal (fuzzy: 1708 encuentra B1708)
  useEffect(() => {
    if (deliveryType !== 'shipping' || form.postal_code.length < 3) {
      setShippingCost(0);
      setPostalCodeStatus('idle');
      setCpSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setPostalCodeStatus('loading');
      const query = form.postal_code.trim();

      // Buscar exact match primero, luego fuzzy (sin letra prefix)
      const { data } = await supabase
        .from('shipping_rates')
        .select('postal_code, zone_name, cost')
        .or(`postal_code.ilike.${query},postal_code.ilike.B${query},postal_code.ilike.%${query}%`)
        .order('postal_code')
        .limit(6);

      if (data && data.length > 0) {
        // Exact match (con o sin B)?
        const exact = data.find(
          r => r.postal_code.toLowerCase() === query.toLowerCase() ||
               r.postal_code.toLowerCase() === `b${query.toLowerCase()}`
        );
        if (exact) {
          setShippingCost(Number(exact.cost));
          setPostalCodeStatus('found');
          setCpSuggestions([]);
          setShowSuggestions(false);
        } else {
          // Mostrar sugerencias
          setCpSuggestions(data as any);
          setShowSuggestions(true);
          setShippingCost(0);
          setPostalCodeStatus('idle');
        }
      } else {
        setShippingCost(0);
        setPostalCodeStatus('not_found');
        setCpSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.postal_code, deliveryType]);

  const totalWithShipping = totalPrice + shippingCost;

  const handleSubmit = async () => {
    if (!form.billing_name.trim()) { toast({ title: 'Ingresá tu nombre completo', variant: 'destructive' }); return; }
    if (!form.billing_dni_cuit.trim()) { toast({ title: `Ingresá tu ${form.invoice_type === 'factura_a' ? 'CUIT' : 'DNI o CUIT'}`, variant: 'destructive' }); return; }
    if (form.invoice_type === 'factura_a' && form.billing_dni_cuit.length !== 11) { toast({ title: 'El CUIT debe tener exactamente 11 dígitos sin guiones', variant: 'destructive' }); return; }
    if (deliveryType === 'shipping') {
      if (!form.address_street.trim()) { toast({ title: 'Ingresá la calle', variant: 'destructive' }); return; }
      if (!form.address_number.trim()) { toast({ title: 'Ingresá el número', variant: 'destructive' }); return; }
      if (!form.address_city.trim()) { toast({ title: 'Ingresá la localidad', variant: 'destructive' }); return; }
      if (!form.postal_code.trim()) { toast({ title: 'El código postal es obligatorio para envíos', variant: 'destructive' }); return; }
      if (postalCodeStatus === 'not_found') { toast({ title: 'Código postal sin tarifa configurada. Contactanos por WhatsApp.', variant: 'destructive' }); return; }
    }

    setPaying(true);
    try {
      const payload = {
        items: items.map(({ product, quantity }) => ({
          name: product.name,
          brand: product.brand,
          price: product.price,
          quantity,
        })),
        shipping_cost: shippingCost,
        delivery_type: deliveryType,
        shipping_address: deliveryType === 'shipping'
          ? [form.address_street, form.address_number, form.address_between ? `entre ${form.address_between}` : '', form.address_city].filter(Boolean).join(' ')
          : null,
        shipping_postal_code: deliveryType === 'shipping' ? form.postal_code : null,
        billing_name: form.billing_name,
        billing_dni_cuit: form.billing_dni_cuit,
        invoice_type: form.invoice_type,
      };

      const { data, error } = await supabase.functions.invoke('create-mp-preference', { body: payload });
      if (error) throw error;

      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (redirectUrl) {
        clearCart();
        window.location.href = redirectUrl;
      } else {
        throw new Error('No se pudo obtener la URL de pago');
      }
    } catch (err: any) {
      toast({ title: 'Error al procesar el pago', description: err.message || 'Intentá de nuevo', variant: 'destructive' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al carrito
        </button>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-8 uppercase tracking-wider">Finalizar compra</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Formulario */}
          <div className="space-y-6">

            {/* Datos de facturación */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-foreground mb-4">Datos de facturación</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-sm font-medium text-foreground">Nombre completo *</label>
                  <input
                    type="text"
                    value={form.billing_name}
                    onChange={e => setForm(f => ({ ...f, billing_name: e.target.value }))}
                    placeholder="Juan García"
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-2 block">Tipo de factura *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="invoice_type"
                        value="consumidor_final"
                        checked={form.invoice_type === 'consumidor_final'}
                        onChange={() => setForm(f => ({ ...f, invoice_type: 'consumidor_final', billing_dni_cuit: '' }))}
                        className="accent-primary w-4 h-4"
                      />
                      <span className="font-body text-sm text-foreground">Consumidor Final</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="invoice_type"
                        value="factura_a"
                        checked={form.invoice_type === 'factura_a'}
                        onChange={() => setForm(f => ({ ...f, invoice_type: 'factura_a', billing_dni_cuit: '' }))}
                        className="accent-primary w-4 h-4"
                      />
                      <span className="font-body text-sm text-foreground">Factura A</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground">
                    {form.invoice_type === 'factura_a' ? 'CUIT *' : 'DNI / CUIT *'}
                  </label>
                  {form.invoice_type === 'factura_a' && (
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Solo CUIT, 11 dígitos sin guiones</p>
                  )}
                  <input
                    type="text"
                    value={form.billing_dni_cuit}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      const max = form.invoice_type === 'factura_a' ? 11 : 11;
                      if (val.length <= max) setForm(f => ({ ...f, billing_dni_cuit: val }));
                    }}
                    placeholder={form.invoice_type === 'factura_a' ? '20123456789' : '12345678'}
                    maxLength={11}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.invoice_type === 'factura_a' && form.billing_dni_cuit.length > 0 && form.billing_dni_cuit.length < 11 && (
                    <p className="mt-1 font-body text-xs text-destructive">El CUIT debe tener 11 dígitos ({form.billing_dni_cuit.length}/11)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Método de entrega */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-foreground mb-4">Método de entrega</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${deliveryType === 'pickup' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-muted-foreground'}`}
                >
                  <MapPin className={`h-5 w-5 mt-0.5 shrink-0 ${deliveryType === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Retiro en local</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Av. Hipólito Yrigoyen 510, Morón</p>
                    <p className="font-body text-xs font-bold text-green-600 mt-1">Sin costo adicional</p>
                  </div>
                </button>
                <button
                  onClick={() => setDeliveryType('shipping')}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${deliveryType === 'shipping' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-muted-foreground'}`}
                >
                  <Truck className={`h-5 w-5 mt-0.5 shrink-0 ${deliveryType === 'shipping' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Envío a domicilio</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Calculado por código postal</p>
                    {shippingCost > 0 && (
                      <p className="font-body text-xs font-bold text-primary mt-1">+ {formatPrice(shippingCost)}</p>
                    )}
                  </div>
                </button>
              </div>

              {/* Dirección de envío */}
              {deliveryType === 'shipping' && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-body text-xs text-muted-foreground">
                      📋 La dirección ingresada se utilizará tanto para la <strong>facturación</strong> como para el <strong>envío</strong>.
                    </p>
                  </div>

                  <p className="font-body text-sm font-semibold text-foreground">Dirección completa para el envío</p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="font-body text-sm font-medium text-foreground">Calle *</label>
                      <input
                        type="text"
                        value={form.address_street}
                        onChange={e => setForm(f => ({ ...f, address_street: e.target.value }))}
                        placeholder="Av. Hipólito Yrigoyen"
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm font-medium text-foreground">Número *</label>
                      <input
                        type="text"
                        value={form.address_number}
                        onChange={e => setForm(f => ({ ...f, address_number: e.target.value }))}
                        placeholder="510"
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-body text-sm font-medium text-foreground">Entre calles</label>
                    <input
                      type="text"
                      value={form.address_between}
                      onChange={e => setForm(f => ({ ...f, address_between: e.target.value }))}
                      placeholder="Ej: Rivadavia y Perón"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="font-body text-sm font-medium text-foreground">Localidad *</label>
                    <input
                      type="text"
                      value={form.address_city}
                      onChange={e => setForm(f => ({ ...f, address_city: e.target.value }))}
                      placeholder="Morón"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground">Código postal *</label>
                    <div className="relative mt-1" ref={cpWrapperRef}>
                      <input
                        type="text"
                        value={form.postal_code}
                        onChange={e => {
                          setForm(f => ({ ...f, postal_code: e.target.value }));
                          setPostalCodeStatus('idle');
                          setShippingCost(0);
                        }}
                        onFocus={() => cpSuggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="1708 o B1708"
                        maxLength={8}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      />
                      {postalCodeStatus === 'loading' && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {showSuggestions && cpSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                          {cpSuggestions.map(s => (
                            <button
                              key={s.postal_code}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, postal_code: s.postal_code }));
                                setShippingCost(Number(s.cost));
                                setPostalCodeStatus('found');
                                setCpSuggestions([]);
                                setShowSuggestions(false);
                              }}
                              className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                            >
                              <div>
                                <span className="font-body text-sm font-semibold text-foreground">{s.postal_code}</span>
                                {s.zone_name && (
                                  <span className="ml-2 font-body text-sm text-muted-foreground">{s.zone_name}</span>
                                )}
                              </div>
                              <span className="font-body text-sm font-medium text-primary">{formatPrice(s.cost)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {postalCodeStatus === 'found' && (
                      <p className="mt-1 font-body text-xs text-green-600">✓ Envío disponible — {formatPrice(shippingCost)}</p>
                    )}
                    {postalCodeStatus === 'not_found' && (
                      <p className="mt-1 font-body text-xs text-destructive">⚠ Sin tarifa para este código postal. <a href="https://wa.me/5491149989332" className="underline">Consultanos por WhatsApp</a>.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 sticky top-4">
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-foreground mb-4">Resumen del pedido</h2>
              <div className="space-y-3 mb-4">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded overflow-hidden bg-muted">
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        : <Package className="h-full w-full p-2 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs font-medium text-foreground truncate">{product.name}</p>
                      {product.brand && <p className="font-body text-[10px] text-muted-foreground">{product.brand}</p>}
                      <p className="font-body text-xs text-muted-foreground">x{quantity}</p>
                    </div>
                    <span className="font-body text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                )}
                {deliveryType === 'pickup' && (
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="text-green-600 font-medium">Gratis</span>
                  </div>
                )}
                <div className="flex justify-between font-heading text-lg font-bold border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatPrice(totalWithShipping)}</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={paying || (deliveryType === 'shipping' && postalCodeStatus === 'not_found')}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-heading text-sm font-bold tracking-widest text-white transition-colors hover:bg-primary/85 disabled:opacity-50"
              >
                {paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</> : 'Abonar'}
              </button>
              <p className="mt-3 text-center font-body text-xs text-muted-foreground">
                Pago seguro procesado por Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
