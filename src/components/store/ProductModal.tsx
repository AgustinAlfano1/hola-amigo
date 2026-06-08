import { X, ShoppingCart, Tag, MessageCircle, Package, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useEffect } from 'react';
import type { DBProduct } from '@/hooks/useProducts';
import type { Promotion } from '@/hooks/usePromotions';
import CountdownTimer from './CountdownTimer';

interface ProductModalProps {
  product: DBProduct | null;
  promotion?: Promotion;
  onClose: () => void;
}

const WHATSAPP_NUMBER = '5491149989332';

const ProductModal = ({ product, promotion, onClose }: ProductModalProps) => {
  const { addToCart, setIsOpen: openCart } = useCart();

  // Cerrar con Escape
  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const outOfStock = product.stock_quantity !== undefined ? product.stock_quantity <= 0 : !product.in_stock;
  const activePrice = promotion ? promotion.promotional_price : product.price;
  const originalPrice = promotion ? product.price : product.original_price;
  const hasDiscount = originalPrice && originalPrice > activePrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice! - activePrice) / originalPrice!) * 100)
    : 0;

  const whatsappMsg = encodeURIComponent(`¡Hola! Me interesa el producto: *${product.name}*${product.brand ? ` (${product.brand})` : ''}. ¿Tienen disponibilidad?`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  return (
    <>
      {/* Backdrop — z-50, clickeable */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Contenedor del modal — z-[51], pointer-events-none para que los clicks en los bordes pasen al backdrop */}
      <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:flex-row max-h-[90vh] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image */}
          <div className="relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden bg-zinc-100 md:h-auto md:w-2/5">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-300">
                <Package className="h-16 w-16" />
                <span className="font-body text-xs">Sin imagen</span>
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {promotion && (
                <div className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 shadow">
                  <Zap className="h-3 w-3 text-white" />
                  <span className="font-body text-xs font-bold text-white">PROMOCIÓN</span>
                </div>
              )}
              {hasDiscount && (
                <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1">
                  <Tag className="h-3 w-3 text-white" />
                  <span className="font-body text-xs font-bold text-white">-{discountPct}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.brand && (
                <span className="rounded border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-body text-xs font-bold uppercase tracking-widest text-primary">
                  {product.brand}
                </span>
              )}
              {product.category && (
                <span className="rounded border border-border bg-secondary px-2.5 py-0.5 font-body text-xs text-muted-foreground uppercase tracking-wide">
                  {product.category}
                </span>
              )}
              {product.codigo && (
                <span className="font-mono text-xs text-muted-foreground">#{product.codigo}</span>
              )}
            </div>

            <h2 className="font-heading text-2xl font-bold leading-tight text-foreground mb-2">{product.name}</h2>

            {product.description && (
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{product.description}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              {outOfStock ? (
                <><AlertCircle className="h-4 w-4 text-destructive" /><span className="font-body text-sm font-medium text-destructive">Sin stock</span></>
              ) : (
                <><CheckCircle className="h-4 w-4 text-green-500" /><span className="font-body text-sm font-medium text-green-600">En stock {product.stock_quantity > 0 ? `(${product.stock_quantity} unidades)` : ''}</span></>
              )}
            </div>

            {/* Promotion countdown */}
            {promotion && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="font-body text-xs text-amber-600 font-medium">Precio promocional por tiempo limitado</p>
                  <CountdownTimer expiresAt={promotion.expires_at} />
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-end gap-3">
                <span className={`font-heading text-4xl font-bold leading-none ${promotion ? 'text-amber-600' : 'text-foreground'}`}>
                  {formatPrice(activePrice)}
                </span>
                {hasDiscount && (
                  <span className="font-body text-base text-muted-foreground line-through mb-1">
                    {formatPrice(originalPrice!)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-3">
              <button
                onClick={() => { addToCart({ ...product, price: activePrice }); onClose(); openCart(true); }}
                disabled={outOfStock}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-heading text-sm font-bold tracking-widest text-white transition-all hover:bg-primary/85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" />
                {outOfStock ? 'Sin stock' : 'Agregar al carrito'}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 py-3 font-heading text-sm font-bold tracking-widest text-green-600 transition-all hover:bg-green-500/20"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
