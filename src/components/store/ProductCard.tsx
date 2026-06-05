import { ShoppingCart, AlertCircle, Tag } from 'lucide-react';
import type { DBProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: DBProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const outOfStock = product.stock_quantity !== undefined ? product.stock_quantity <= 0 : !product.in_stock;
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <div className="card-hover group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded bg-primary px-2 py-0.5">
          <Tag className="h-2.5 w-2.5 text-white" />
          <span className="font-body text-[10px] font-bold text-white">-{discountPct}%</span>
        </div>
      )}

      {/* Out of stock overlay */}
      {outOfStock && (
        <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
          <span className="rounded border border-destructive/30 bg-background px-3 py-1 font-heading text-xs font-semibold text-destructive tracking-widest">
            SIN STOCK
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative flex h-44 items-center justify-center bg-zinc-50 overflow-hidden border-b border-border">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-5xl">🔧</span>';
            }}
          />
        ) : (
          <span className="text-5xl opacity-30">🔧</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="mb-2 inline-block w-fit rounded-sm border border-primary/20 bg-primary/8 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-widest text-primary">
            {product.brand}
          </span>
        )}

        <h3 className="font-heading text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 font-body text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          {/* Price */}
          <div className="mb-3 flex items-end gap-2">
            <span className="font-heading text-2xl font-bold text-foreground leading-none">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="font-body text-xs text-muted-foreground line-through mb-0.5">
                {formatPrice(product.original_price!)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 font-heading text-xs font-semibold tracking-widest text-white transition-all hover:bg-primary/85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
