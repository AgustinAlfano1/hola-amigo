import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Tu Carrito</h2>
          <button onClick={() => setIsOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="py-12 text-center font-body text-sm text-muted-foreground">
              Tu carrito está vacío
            </p>
          ) : (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-secondary text-2xl">
                    {product.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate font-body text-sm font-medium text-foreground">{product.name}</h4>
                    <p className="font-body text-xs text-muted-foreground">{product.brand}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-body text-sm font-medium text-foreground">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-heading text-sm font-bold text-foreground">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(product.id)} className="self-start text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-2xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
            </div>
            <button className="w-full rounded-lg bg-primary py-3 font-heading text-sm font-semibold tracking-wider text-primary-foreground transition-colors hover:bg-primary/90">
              Pagar con Mercado Pago
            </button>
            <button onClick={clearCart} className="w-full rounded-lg border border-border py-2 font-body text-xs text-muted-foreground hover:text-foreground">
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
