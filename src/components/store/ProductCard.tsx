import { ShoppingCart, AlertCircle } from 'lucide-react';
import type { DBProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: DBProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="card-hover group flex flex-col rounded-lg border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex h-40 items-center justify-center bg-secondary text-5xl overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '🔧'; }}
          />
        ) : '🔧'}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="mb-2 inline-block w-fit rounded-sm bg-primary/10 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-primary">
            {product.brand}
          </span>
        )}

        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 font-body text-xs text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between">
            <div>
              {product.original_price && product.original_price > product.price && (
                <span className="block font-body text-xs text-muted-foreground line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
              <span className="font-heading text-xl font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
            </div>
            {(product.stock_quantity !== undefined ? product.stock_quantity <= 0 : !product.in_stock) && (
              <span className="flex items-center gap-1 font-body text-[10px] text-destructive">
                <AlertCircle className="h-3 w-3" /> Sin stock
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product)}
            disabled={product.stock_quantity !== undefined ? product.stock_quantity <= 0 : !product.in_stock}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-body text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
