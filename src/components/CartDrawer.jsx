import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

export function CartDrawer({ onNavigateToCheckout, onNavigateToCart }) {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingThreshold,
    triggerTrafficSurgeCheckout
  } = useCart();

  if (!isCartDrawerOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    triggerTrafficSurgeCheckout(() => {
      onNavigateToCheckout();
    });
  };

  const handleFullCartClick = () => {
    setIsCartDrawerOpen(false);
    onNavigateToCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-container-low border-l border-outline-variant/20 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl text-on-background">Your Atelier Bag</h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-bright/20"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-surface-container border-b border-outline-variant/10 text-xs">
            {isFreeShipping ? (
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Complimentary White-Glove Atelier Shipping unlocked!</span>
              </div>
            ) : (
              <div>
                <p className="text-on-surface-variant mb-1.5">
                  Add <strong className="text-primary">${amountNeededForFreeShipping.toFixed(2)}</strong> more for complimentary luxury delivery.
                </p>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant border border-outline-variant/20">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-display text-lg text-on-surface">Your bag is empty</p>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                  Explore our curated artisan collections to acquire handcrafted heirloom pieces.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-surface-container rounded border border-outline-variant/10 hover:border-outline-variant/25 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded shrink-0 bg-surface-variant"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-headline text-sm text-on-surface font-medium leading-snug">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-outline-variant/30 rounded bg-surface-container-high text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 px-2 text-on-surface-variant hover:text-on-surface"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 px-2 text-on-surface-variant hover:text-on-surface"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-headline text-sm font-semibold text-on-surface">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant uppercase tracking-wider font-label text-xs">Estimated Subtotal</span>
                <span className="font-headline text-lg font-semibold text-on-surface">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-all duration-300 shadow-xl"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleFullCartClick}
                  className="w-full py-2.5 text-center text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  View Full Cart & Apply Codes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
