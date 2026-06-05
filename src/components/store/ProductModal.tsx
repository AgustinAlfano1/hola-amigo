import { X, ShoppingCart, Tag, MessageCircle, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { DBProduct } from '@/hooks/useProducts';

interface ProductModalProps {
  product: DBProduct | null;
  onClose: () => void;
}

const WHATSAPP_NUMBER = '5491149989332';

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const { addToCart } = useCart();

  if (!product) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const outOfStock = product.stock_quantity !== undefined ? product.stock_quantity <= 0 : !product.in_stock;
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const whatsappMsg = encodeURIComponent(`¡Hola! Me interesa el producto: *${product.name}*${product.brand ? ` (${product.brand})` : ''}. ¿Tienen disponibilidad?`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  const handleAddToCart = () => {
    addToCart(product);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:flex-row max-h-[90vh]">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image */}
          <div className="relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden bg-zinc-100 md:h-auto md:w-2/5">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-300">
                <Package className="h-16 w-16" />
                <span className="font-body text-xs">Sin imagen</span>
              </div>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1">
                <Tag className="h-3 w-3 text-white" />
                <span className="font-body text-xs font-bold text-white">-{discountPct}%</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-y-auto p-6">

            {/* Brand + Category */}
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

            {/* Name */}
            <h2 className="font-heading text-2xl font-bold leading-tight text-foreground mb-2">
              {product.name}
            </h2>

            {/* Description */}
            {product.description && (
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-4">
              {outOfStock ? (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-body text-sm font-medium text-destructive">Sin stock</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-body text-sm font-medium text-green-600">
                    En stock {product.stock_quantity > 0 ? `(${product.stock_quantity} unidades)` : ''}
                  </span>
                </>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-end gap-3">
                <span className="font-heading text-4xl font-bold text-foreground leading-none">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="font-body text-base text-muted-foreground line-through mb-1">
                    {formatPrice(product.original_price!)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
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
