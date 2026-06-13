import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const handleCheckout = () => {
    if (!user) {
      toast({ title: 'Iniciá sesión para comprar', variant: 'destructive' });
      setIsOpen(false);
      navigate('/auth');
      return;
    }
    setIsOpen(false);
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold tracking-wider text-white">Tu Carrito</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 font-body text-[10px] font-bold text-white">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-700 mb-4" />
              <p className="font-heading text-sm tracking-wider text-zinc-500">Tu carrito está vacío</p>
              <p className="mt-1 font-body text-xs text-zinc-600">Agregá productos para continuar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-zinc-800 text-2xl overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {product.brand && (
                      <span className="font-body text-[10px] font-bold uppercase tracking-widest text-primary">
                        {product.brand}
                      </span>
                    )}
                    <h4 className="truncate font-body text-sm font-medium text-white leading-tight">{product.name}</h4>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded border border-zinc-700 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-body text-sm font-medium text-white px-1">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-heading text-sm font-bold text-white">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="self-start rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3 bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-zinc-400">Total del pedido</span>
              <span className="font-heading text-2xl font-bold text-white">{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={handleCheckout}
              
              className="flex w-full items-center justify-center gap-2 rounded bg-primary py-3 font-heading text-sm font-bold tracking-widest text-white transition-colors hover:bg-primary/85 disabled:opacity-50"
            >
              Finalizar compra
            </button>
            <button
              onClick={clearCart}
              className="w-full rounded border border-zinc-700 py-2 font-body text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
