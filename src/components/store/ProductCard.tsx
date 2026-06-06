import { ShoppingCart, Tag, Eye, Zap } from 'lucide-react';
import type { DBProduct } from '@/hooks/useProducts';
import type { Promotion } from '@/hooks/usePromotions';
import { useCart } from '@/contexts/CartContext';
import CountdownTimer from './CountdownTimer';

interface ProductCardProps {
  product: DBProduct;
  promotion?: Promotion;
  onClick?: () => void;
}

const ProductCard = ({ product, promotion, onClick }: ProductCardProps) => {
  const { addToCart } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const outOfStock = product.stock_quantity !== undefined ? product.stock_quantity <= 0 : !product.in_stock;
  const activePrice = promotion ? promotion.promotional_price : product.price;
  const originalPrice = promotion ? product.price : product.original_price;
  const hasDiscount = originalPrice && originalPrice > activePrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice! - activePrice) / originalPrice!) * 100)
    : 0;

  return (
    <div
      className="card-hover group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden cursor-pointer"
      style={{ boxShadow: promotion ? '0 0 0 2px hsl(var(--primary) / 0.4), var(--shadow-card)' : 'var(--shadow-card)' }}
      onClick={onClick}
    >
      {/* Badges */}
      <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
        {promotion && (
          <div className="flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 shadow">
            <Zap className="h-2 w-2 text-white" />
            <span className="font-body text-[9px] font-bold text-white uppercase">Promo</span>
          </div>
        )}
        {hasDiscount && (
          <div className="flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5">
            <Tag className="h-2 w-2 text-white" />
            <span className="font-body text-[9px] font-bold text-white">-{discountPct}%</span>
          </div>
        )}
        {outOfStock && (
          <div className="rounded border border-destructive/40 bg-background/90 px-1.5 py-0.5 backdrop-blur-sm">
            <span className="font-heading text-[9px] font-bold text-destructive tracking-wide">SIN STOCK</span>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative flex h-32 md:h-44 items-center justify-center bg-zinc-50 overflow-hidden border-b border-border">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-60' : ''}`}
          />
        ) : (
          <span className="text-3xl md:text-5xl opacity-30">🔧</span>
        )}
        <div className="absolute inset-0 hidden md:flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-body text-xs font-semibold text-zinc-800 shadow">
            <Eye className="h-3.5 w-3.5" />
            Ver detalle
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2.5 md:p-4">
        {product.brand && (
          <span className="mb-1 inline-block w-fit rounded-sm border border-primary/20 bg-primary/8 px-1.5 py-0.5 font-body text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-primary">
            {product.brand}
          </span>
        )}

        <h3 className="font-heading text-xs md:text-sm font-semibold leading-snug text-foreground line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-0.5 hidden md:block font-body text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="mt-auto pt-2 md:pt-4">
          {promotion && <CountdownTimer expiresAt={promotion.expires_at} className="mb-1.5" />}

          <div className="mb-2 flex items-end gap-1.5">
            <span className={`font-heading text-base md:text-2xl font-bold leading-none ${promotion ? 'text-amber-600' : 'text-foreground'}`}>
              {formatPrice(activePrice)}
            </span>
            {hasDiscount && (
              <span className="hidden md:block font-body text-xs text-muted-foreground line-through mb-0.5">
                {formatPrice(originalPrice!)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); addToCart({ ...product, price: activePrice }); }}
            disabled={outOfStock}
            className="flex w-full items-center justify-center gap-1 md:gap-2 rounded bg-primary px-2 py-2 md:px-4 md:py-2.5 font-heading text-[10px] md:text-xs font-semibold tracking-widest text-white transition-all hover:bg-primary/85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ShoppingCart className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span className="hidden sm:inline">Agregar al carrito</span>
            <span className="sm:hidden">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
